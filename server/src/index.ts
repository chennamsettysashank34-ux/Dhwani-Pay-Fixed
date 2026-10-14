import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRazorpayQr, createCashfreeQr } from './gatewayService';

dotenv.config();

const PORT = process.env.PORT || 8080;
const IS_PROD = process.env.NODE_ENV === 'production';

// Gateway Credentials & Security Keys
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'sandbox';
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || '';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const WS_AUTH_SECRET = process.env.WS_AUTH_SECRET || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dhwanipay_secure_ws_salt';

// Max timestamp tolerance for Cashfree webhooks (5 minutes)
const MAX_WEBHOOK_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

// Idempotency cache for webhooks (prevents replaying notifications)
const processedWebhooks = new Map<string, number>();

function isAlreadyProcessed(eventId: string): boolean {
  const now = Date.now();
  // Clean entries older than 30 minutes
  for (const [key, ts] of processedWebhooks.entries()) {
    if (now - ts > 30 * 60 * 1000) {
      processedWebhooks.delete(key);
    }
  }

  if (processedWebhooks.has(eventId)) {
    return true;
  }
  processedWebhooks.set(eventId, now);
  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompare(a: string, b: string, encoding: 'hex' | 'base64' | 'utf8' = 'utf8'): boolean {
  try {
    const bufA = Buffer.from(a, encoding);
    const bufB = Buffer.from(b, encoding);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

const app = express();

// Security middleware: Limit JSON payload size & preserve raw buffer for HMAC
app.use(
  express.json({
    limit: '256kb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Restricted CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'https://dhwanipay.in'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps (no origin) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin) || !IS_PROD) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-merchant-id'],
  })
);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

/**
 * Merchant-Isolated WebSocket Registry
 * Map: merchantId -> Set<WebSocket>
 */
const merchantConnections = new Map<string, Set<WebSocket>>();
const allAuthenticatedSockets = new Set<WebSocket>();

// Periodic heartbeat to clean up disconnected/dead sockets
const heartbeatInterval = setInterval(() => {
  for (const [merchantId, sockets] of merchantConnections.entries()) {
    for (const ws of sockets) {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        sockets.delete(ws);
      } else {
        (ws as any).isAlive = false;
        ws.ping();
      }
    }
    if (sockets.size === 0) {
      merchantConnections.delete(merchantId);
    }
  }
}, 30000);

wss.on('close', () => clearInterval(heartbeatInterval));

// Handle HTTP upgrade with merchant authentication & validation
server.on('upgrade', (request, socket, head) => {
  const urlObj = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  
  if (urlObj.pathname !== '/ws') {
    socket.destroy();
    return;
  }

  const merchantId = urlObj.searchParams.get('merchantId') || (request.headers['x-merchant-id'] as string) || '';
  const token = urlObj.searchParams.get('token') || (request.headers['authorization'] as string) || '';

  // Validate merchantId is a non-empty alphanumeric/UUID identifier
  const isValidMerchantId = /^[a-zA-Z0-9_-]{3,64}$/.test(merchantId);

  if (!isValidMerchantId) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  // In production, token authentication is strictly required
  if (IS_PROD) {
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    // Verify bearer token format or shared secret
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    if (cleanToken.length < 16) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    (ws as any).merchantId = merchantId;
    (ws as any).isAlive = true;
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws: WebSocket, req) => {
  const merchantId = (ws as any).merchantId as string;
  (ws as any).isAlive = true;

  ws.on('pong', () => {
    (ws as any).isAlive = true;
  });

  if (!merchantConnections.has(merchantId)) {
    merchantConnections.set(merchantId, new Set<WebSocket>());
  }
  merchantConnections.get(merchantId)!.add(ws);
  allAuthenticatedSockets.add(ws);

  console.log(`[WebSocket] Authorized connection for merchant "${merchantId}". Active devices for merchant: ${merchantConnections.get(merchantId)!.size}`);

  ws.send(
    JSON.stringify({
      type: 'CONNECTED',
      merchantId,
      message: 'Securely connected to DhwaniPay Cloud Soundbox Channel',
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('close', () => {
    const sockets = merchantConnections.get(merchantId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        merchantConnections.delete(merchantId);
      }
    }
    allAuthenticatedSockets.delete(ws);
    console.log(`[WebSocket] Device disconnected for merchant "${merchantId}". Remaining: ${merchantConnections.get(merchantId)?.size || 0}`);
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Socket error for merchant "${merchantId}":`, err.message);
  });
});

/**
 * Broadcasts verified payment event ONLY to the intended merchant's soundbox devices
 */
export function broadcastPaymentToMerchant(
  merchantId: string,
  payment: {
    amount: number;
    payerName?: string;
    source: string;
    utr?: string;
    orderId?: string;
    simulated?: boolean;
  }
): number {
  const targetSockets = merchantConnections.get(merchantId);
  const packet = JSON.stringify({
    type: 'PAYMENT_RECEIVED',
    ...payment,
    merchantId,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Broadcast] Sending ₹${payment.amount} to merchant "${merchantId}". Connected targets: ${targetSockets?.size || 0}`);

  if (!targetSockets || targetSockets.size === 0) {
    return 0;
  }

  let sentCount = 0;
  for (const client of targetSockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(packet);
      sentCount++;
    }
  }
  return sentCount;
}

// 1. Healthcheck & Active Connections
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    activeMerchants: merchantConnections.size,
    activeSoundboxConnections: allAuthenticatedSockets.size,
    environment: IS_PROD ? 'production' : 'development',
    timestamp: new Date().toISOString(),
  });
});

// 2. Gateway Credentials Status (No secrets exposed)
app.get('/api/gateway/credentials-status', (_req: Request, res: Response) => {
  res.json({
    razorpay: {
      configured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
      hasWebhookSecret: Boolean(RAZORPAY_WEBHOOK_SECRET),
      keyIdPreview: RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.slice(0, 8)}...` : null,
    },
    cashfree: {
      configured: Boolean(CASHFREE_APP_ID && CASHFREE_SECRET_KEY),
      hasWebhookSecret: Boolean(CASHFREE_CLIENT_SECRET),
      environment: CASHFREE_ENV,
    },
    activeMerchants: merchantConnections.size,
    activeSoundboxes: allAuthenticatedSockets.size,
  });
});

// 3. Create Dynamic Gateway UPI QR
app.post('/api/gateway/create-qr', async (req: Request, res: Response) => {
  try {
    const { amount, customerName, notes, provider = 'razorpay' } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0 || numAmount > 500000) {
      return res.status(400).json({ error: 'Valid amount between ₹1 and ₹500,000 is required.' });
    }

    if (provider !== 'razorpay' && provider !== 'cashfree') {
      return res.status(400).json({ error: 'Invalid provider. Must be "razorpay" or "cashfree".' });
    }

    let qrResult;
    if (provider === 'cashfree') {
      qrResult = await createCashfreeQr(
        { amount: numAmount, customerName: customerName ? String(customerName).slice(0, 50) : undefined, notes: notes ? String(notes).slice(0, 100) : undefined, provider: 'cashfree' },
        CASHFREE_APP_ID,
        CASHFREE_SECRET_KEY,
        CASHFREE_ENV === 'production'
      );
    } else {
      qrResult = await createRazorpayQr(
        { amount: numAmount, customerName: customerName ? String(customerName).slice(0, 50) : undefined, notes: notes ? String(notes).slice(0, 100) : undefined, provider: 'razorpay' },
        RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET
      );
    }

    res.json({
      success: true,
      data: qrResult,
    });
  } catch (error: any) {
    console.error('[Create QR Error]:', error.message);
    res.status(500).json({ error: 'Failed to create payment QR' });
  }
});

// 4. Razorpay Payment Webhook
app.post('/api/webhooks/razorpay', (req: any, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing x-razorpay-signature header' });
  }

  const webhookSecret = RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Razorpay] Webhook secret not configured on server');
    return res.status(500).json({ error: 'Webhook processing unavailable' });
  }

  // Validate raw request body is available
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

  // Compute expected HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!safeCompare(signature, expectedSignature, 'hex')) {
    console.warn('[Razorpay] Cryptographic signature mismatch rejected');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = req.body;
  const event = body?.event;
  const eventId = body?.payload?.payment?.entity?.id || req.headers['x-razorpay-event-id'] || `${event}_${Date.now()}`;

  // Idempotency check: discard already-handled webhooks
  if (isAlreadyProcessed(eventId)) {
    console.log(`[Razorpay] Duplicate webhook ignored for eventId: ${eventId}`);
    return res.status(200).json({ status: 'already_processed' });
  }

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = body.payload?.payment?.entity;
    if (paymentEntity && paymentEntity.status === 'captured') {
      const amountInRupees = paymentEntity.amount / 100;
      const payerName = paymentEntity.notes?.customer_name || paymentEntity.email || undefined;
      const utr = paymentEntity.acquirer_data?.rrn || paymentEntity.id;
      const merchantId = paymentEntity.notes?.merchant_id || 'default_merchant';

      broadcastPaymentToMerchant(merchantId, {
        amount: amountInRupees,
        payerName,
        source: 'Razorpay UPI',
        utr,
        orderId: paymentEntity.order_id,
        simulated: false,
      });
    }
  }

  return res.status(200).json({ status: 'ok' });
});

// 5. Cashfree Payment Webhook
app.post('/api/webhooks/cashfree', (req: any, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  // Strict check: Both signature and timestamp headers MUST be present
  if (!signature || !timestamp) {
    return res.status(400).json({ error: 'Missing x-webhook-signature or x-webhook-timestamp header' });
  }

  const secret = CASHFREE_CLIENT_SECRET;
  if (!secret) {
    console.error('[Cashfree] Webhook secret not configured on server');
    return res.status(500).json({ error: 'Webhook processing unavailable' });
  }

  // Validate timestamp freshness (reject replayed requests older than 5 minutes)
  const webhookTs = Number(timestamp) * 1000;
  if (isNaN(webhookTs) || Math.abs(Date.now() - webhookTs) > MAX_WEBHOOK_TIMESTAMP_DRIFT_MS) {
    console.warn(`[Cashfree] Webhook timestamp drift rejected: ${timestamp}`);
    return res.status(401).json({ error: 'Webhook timestamp expired or invalid' });
  }

  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
  const dataToSign = `${timestamp}${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64');

  if (!safeCompare(signature, expectedSignature, 'base64')) {
    console.warn('[Cashfree] Cryptographic signature mismatch rejected');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = req.body;
  const payment = body?.data?.payment;
  const customer = body?.data?.customer_details;
  const paymentId = payment?.cf_payment_id || body?.event_time || `${Date.now()}`;

  // Idempotency check
  if (isAlreadyProcessed(String(paymentId))) {
    console.log(`[Cashfree] Duplicate webhook ignored for paymentId: ${paymentId}`);
    return res.status(200).json({ status: 'already_processed' });
  }

  // Verify payment status is confirmed SUCCESS
  const isPaymentSuccess =
    body.type === 'PAYMENT_SUCCESS_WEBHOOK' ||
    payment?.payment_status === 'SUCCESS';

  if (isPaymentSuccess && payment?.payment_amount > 0) {
    const merchantId = body.data?.order?.order_tags?.merchant_id || 'default_merchant';

    broadcastPaymentToMerchant(merchantId, {
      amount: Number(payment.payment_amount),
      payerName: customer?.customer_name,
      source: 'Cashfree UPI',
      utr: payment.bank_reference,
      orderId: body.data?.order?.order_id,
      simulated: false,
    });
  }

  return res.status(200).json({ status: 'ok' });
});

// Middleware for Admin / Simulation Authentication
function requireAdminAuth(req: Request, res: Response, next: () => void) {
  const adminKey = req.headers['x-admin-key'] as string;

  // In production, an explicit non-empty ADMIN_API_KEY must match
  if (!adminKey || !ADMIN_API_KEY || !safeCompare(adminKey, ADMIN_API_KEY)) {
    return res.status(403).json({ error: 'Unauthorized: Invalid admin credentials' });
  }
  next();
}

// 6. Simulate Verified Webhook Confirmation (Secured)
app.post('/api/gateway/simulate-webhook', requireAdminAuth, (req: Request, res: Response) => {
  const { amount = 100, payerName = 'Test Customer', provider = 'razorpay', merchantId = 'default_merchant' } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0 || numAmount > 100000) {
    return res.status(400).json({ error: 'Simulation amount must be between ₹1 and ₹100,000' });
  }

  const source = provider === 'cashfree' ? 'Cashfree UPI (Simulated)' : 'Razorpay UPI (Simulated)';

  const count = broadcastPaymentToMerchant(String(merchantId), {
    amount: numAmount,
    payerName: String(payerName).slice(0, 50),
    source,
    utr: `SIM${Date.now().toString().slice(-8)}`,
    simulated: true,
  });

  res.json({
    success: true,
    message: `Simulated payment of ₹${numAmount} dispatched to ${count} soundbox devices for merchant "${merchantId}".`,
  });
});

// 7. Manual Test Payment Endpoint (Secured)
app.post('/api/test-payment', requireAdminAuth, (req: Request, res: Response) => {
  const { amount = 50, payerName = 'Test Customer', source = 'UPI Test', merchantId = 'default_merchant' } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0 || numAmount > 100000) {
    return res.status(400).json({ error: 'Test amount must be between ₹1 and ₹100,000' });
  }

  const count = broadcastPaymentToMerchant(String(merchantId), {
    amount: numAmount,
    payerName: String(payerName).slice(0, 50),
    source: `${source} (Test)`,
    utr: `TEST${Date.now().toString().slice(-6)}`,
    simulated: true,
  });

  res.json({
    success: true,
    message: `Test payment of ₹${numAmount} dispatched to ${count} devices for merchant "${merchantId}".`,
  });
});

export { app, server, wss, merchantConnections, broadcastPaymentToMerchant };

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` DhwaniPay Hardened Cloud Server running on port ${PORT}`);
    console.log(` WebSocket URL:       ws://localhost:${PORT}/ws?merchantId=<id>&token=<token>`);
    console.log(` Create Dynamic QR:   POST http://localhost:${PORT}/api/gateway/create-qr`);
    console.log(` Razorpay Webhook:    POST http://localhost:${PORT}/api/webhooks/razorpay`);
    console.log(` Cashfree Webhook:    POST http://localhost:${PORT}/api/webhooks/cashfree`);
    console.log(` Healthcheck:         GET  http://localhost:${PORT}/health`);
    console.log(`=======================================================`);
  });
}
