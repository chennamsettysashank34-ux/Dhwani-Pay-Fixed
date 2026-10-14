import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';

// ------------------------------------------------------------------------------
// 1. UPI Deep Link URI & NPCI Formatting Tests
// ------------------------------------------------------------------------------
describe('1. UPI URI & QR Generation (NPCI Standards)', () => {
  function buildUpiUri({ vpa, payeeName, amount, note, transactionRef, mcc }) {
    if (!vpa || !vpa.includes('@')) {
      throw new Error('A valid UPI ID (e.g. yourname@upi) is required.');
    }

    const queryParts = [];
    queryParts.push(`pa=${encodeURIComponent(vpa.trim())}`);
    queryParts.push(`pn=${encodeURIComponent(payeeName?.trim() || 'Merchant')}`);
    queryParts.push(`cu=INR`);

    if (amount && amount > 0) {
      queryParts.push(`am=${amount.toFixed(2)}`);
    }

    if (note) {
      queryParts.push(`tn=${encodeURIComponent(note.slice(0, 80))}`);
    }

    if (transactionRef) {
      queryParts.push(`tr=${encodeURIComponent(transactionRef)}`);
    }

    if (mcc) {
      queryParts.push(`mc=${encodeURIComponent(mcc)}`);
    }

    return `upi://pay?${queryParts.join('&')}`;
  }

  test('generates valid NPCI URI with standard parameters', () => {
    const uri = buildUpiUri({
      vpa: 'merchant@okhdfcbank',
      payeeName: 'Sharma General Store',
      amount: 150,
      note: 'Groceries bill',
      transactionRef: 'TXN12345678',
      mcc: '5411',
    });

    assert.ok(uri.startsWith('upi://pay?'));
    assert.ok(uri.includes('pa=merchant%40okhdfcbank'));
    assert.ok(uri.includes('pn=Sharma%20General%20Store'));
    assert.ok(uri.includes('am=150.00'));
    assert.ok(uri.includes('cu=INR'));
    assert.ok(uri.includes('tn=Groceries%20bill'));
    assert.ok(uri.includes('tr=TXN12345678'));
    assert.ok(uri.includes('mc=5411'));
  });

  test('formats amount to exactly two decimal places as required by NPCI', () => {
    const uri = buildUpiUri({
      vpa: 'kirana@upi',
      payeeName: 'Kirana',
      amount: 49.5,
    });
    assert.ok(uri.includes('am=49.50'));
  });

  test('throws descriptive error on invalid VPA missing @', () => {
    assert.throws(
      () => {
        buildUpiUri({ vpa: 'invalidvpa', payeeName: 'Store' });
      },
      { message: /valid UPI ID/ }
    );
  });
});

// ------------------------------------------------------------------------------
// 2. Notification Parsing & Negative Filtering Tests
// ------------------------------------------------------------------------------
describe('2. Payment Notification Parsing & Negative Filtering', () => {
  const AMOUNT_PATTERN =
    /(?:received|credited|received\s+payment\s+of|payment\s+of)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const FALLBACK_AMOUNT = /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const PAYER_PATTERN =
    /(?:from|by)\s+([a-zA-Z\s]{2,30}?)(?=\s+(?:on|via|with|using|through|in|at)\b|[.,(]|\s*$)/i;
  const UTR_PATTERN = /(?:utr|ref(?:erence)?\s*(?:no|id)?|txn\s*id)[\s:]*([0-9]{8,16})/i;

  const NEGATIVE_KEYWORDS = [
    'debited',
    'paid to',
    'sent to',
    'you paid',
    'withdrawn',
    'payment sent',
    'failed',
    'declined',
    'unsuccessful',
    'reversed',
    'reminder to',
    'requested',
    'request to pay',
    'collect request',
    'cashback offer',
    'scratch card',
    'win up to',
    'reward',
    'coupon',
  ];

  function parseNotification(text) {
    const lower = text.toLowerCase();
    for (const neg of NEGATIVE_KEYWORDS) {
      if (lower.includes(neg)) {
        return { isValid: false, reason: `Negative keyword: ${neg}` };
      }
    }

    const isCredit =
      lower.includes('received') ||
      lower.includes('credited') ||
      lower.includes('paid you') ||
      lower.includes('sent you');

    if (!isCredit) {
      return { isValid: false, reason: 'No credit phrase' };
    }

    const amountMatch = text.match(AMOUNT_PATTERN) || text.match(FALLBACK_AMOUNT);
    const payerMatch = text.match(PAYER_PATTERN);
    const utrMatch = text.match(UTR_PATTERN);

    if (!amountMatch) {
      return { isValid: false, reason: 'No amount found' };
    }

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0 || amount > 1_000_000) {
      return { isValid: false, reason: 'Invalid amount bounds' };
    }

    return {
      isValid: true,
      amount,
      payer: payerMatch ? payerMatch[1].trim() : null,
      utr: utrMatch ? utrMatch[1].trim() : null,
    };
  }

  test('extracts valid credit payment from PhonePe', () => {
    const text = 'Received payment of Rs. 250.00 from Rahul Sharma via PhonePe. UTR: 328901847192';
    const result = parseNotification(text);
    assert.equal(result.isValid, true);
    assert.equal(result.amount, 250.0);
    assert.equal(result.payer, 'Rahul Sharma');
    assert.equal(result.utr, '328901847192');
  });

  test('extracts valid credit payment from Google Pay', () => {
    const text = '₹500.00 received from Sunita Verma on Google Pay';
    const result = parseNotification(text);
    assert.equal(result.isValid, true);
    assert.equal(result.amount, 500.0);
    assert.equal(result.payer, 'Sunita Verma');
  });

  test('rejects debit notifications (money sent out)', () => {
    const text = 'Rs. 450 debited from your A/C ending in 4122. Paid to Sharma Store via UPI.';
    const result = parseNotification(text);
    assert.equal(result.isValid, false);
    assert.match(result.reason, /debited/i);
  });

  test('rejects failed / declined transactions', () => {
    const text = 'Payment of Rs. 300 to Anita Rao failed. Your account was not debited.';
    const result = parseNotification(text);
    assert.equal(result.isValid, false);
  });

  test('rejects payment request notifications', () => {
    const text = 'Rohan requested payment of Rs. 200 on PhonePe. Click to pay.';
    const result = parseNotification(text);
    assert.equal(result.isValid, false);
  });

  test('rejects promotional cashback marketing notifications', () => {
    const text = 'You have won a scratch card! Get Rs. 50 cashback offer on your next payment.';
    const result = parseNotification(text);
    assert.equal(result.isValid, false);
  });

  test('handles high-value comma-separated amounts correctly', () => {
    const text = 'Credited Rs. 45,250.75 from Apex Wholesale Suppliers via Bank UPI. Ref: 991827364512';
    const result = parseNotification(text);
    assert.equal(result.isValid, true);
    assert.equal(result.amount, 45250.75);
    assert.equal(result.payer, 'Apex Wholesale Suppliers');
    assert.equal(result.utr, '991827364512');
  });
});

// ------------------------------------------------------------------------------
// 3. Deduplication & Exactly-Once Announcement Logic
// ------------------------------------------------------------------------------
describe('3. Deduplication & Voice Ownership Architecture', () => {
  const cache = new Map();

  function deduplicate(amount, payer, utr) {
    const key = `${amount}_${payer || 'anon'}_${utr || 'none'}`;
    const now = Date.now();
    const lastSeen = cache.get(key);
    if (lastSeen && now - lastSeen < 120_000) {
      return { isDuplicate: true };
    }
    cache.set(key, now);
    return { isDuplicate: false, key };
  }

  function resolveAnnouncementOwner({ announcedNatively, announcementsEnabled }) {
    if (!announcementsEnabled) {
      return { shouldPlayExpoSpeech: false, reason: 'Muted by user settings' };
    }
    if (announcedNatively) {
      // Native Kotlin Soundbox already spoke; suppress JS speech to prevent duplicate echo
      return { shouldPlayExpoSpeech: false, reason: 'Already announced natively' };
    }
    // Webhook or simulated payment from cloud; play through Expo speech
    return { shouldPlayExpoSpeech: true, reason: 'Needs cloud speech playback' };
  }

  test('first notification is accepted for announcement', () => {
    const res = deduplicate(150, 'Sunil Kumar', 'UTR99887766');
    assert.equal(res.isDuplicate, false);
  });

  test('duplicate notification within 120s is safely suppressed', () => {
    const res = deduplicate(150, 'Sunil Kumar', 'UTR99887766');
    assert.equal(res.isDuplicate, true);
  });

  test('single voice owner suppresses Expo speech when native announcement occurred', () => {
    const plan = resolveAnnouncementOwner({ announcedNatively: true, announcementsEnabled: true });
    assert.equal(plan.shouldPlayExpoSpeech, false);
    assert.equal(plan.reason, 'Already announced natively');
  });

  test('webhook payment triggers Expo speech because native listener was not involved', () => {
    const plan = resolveAnnouncementOwner({ announcedNatively: false, announcementsEnabled: true });
    assert.equal(plan.shouldPlayExpoSpeech, true);
  });
});

// ------------------------------------------------------------------------------
// 4. Webhook Cryptographic Verification & Replay Protection
// ------------------------------------------------------------------------------
describe('4. Webhook Authenticity & Timing-Safe Verification', () => {
  const RZP_SECRET = 'rzp_sec_live_998877665544332211';
  const CF_SECRET = 'cf_sec_live_112233445566778899';

  function safeCompare(a, b, encoding = 'utf8') {
    try {
      const bufA = Buffer.from(a, encoding);
      const bufB = Buffer.from(b, encoding);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  function verifyRazorpay(rawBody, signature, secret) {
    if (!signature || !secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return safeCompare(signature, expected, 'hex');
  }

  function verifyCashfree(rawBody, timestamp, signature, secret) {
    if (!signature || !timestamp || !secret) return { valid: false, error: 'Missing headers' };

    // Check timestamp freshness (max 5 minutes drift)
    const ts = Number(timestamp) * 1000;
    if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return { valid: false, error: 'Timestamp expired' };
    }

    const dataToSign = `${timestamp}${rawBody}`;
    const expected = crypto.createHmac('sha256', secret).update(dataToSign).digest('base64');
    const valid = safeCompare(signature, expected, 'base64');
    return { valid, error: valid ? null : 'Invalid signature' };
  }

  test('verifies valid Razorpay HMAC-SHA256 signature', () => {
    const body = JSON.stringify({ event: 'payment.captured', amount: 50000 });
    const sig = crypto.createHmac('sha256', RZP_SECRET).update(body).digest('hex');
    assert.equal(verifyRazorpay(body, sig, RZP_SECRET), true);
  });

  test('rejects tampered Razorpay payload with valid original signature', () => {
    const body = JSON.stringify({ event: 'payment.captured', amount: 50000 });
    const sig = crypto.createHmac('sha256', RZP_SECRET).update(body).digest('hex');
    const tamperedBody = JSON.stringify({ event: 'payment.captured', amount: 500 });
    assert.equal(verifyRazorpay(tamperedBody, sig, RZP_SECRET), false);
  });

  test('rejects missing Razorpay signature header', () => {
    const body = JSON.stringify({ event: 'payment.captured', amount: 50000 });
    assert.equal(verifyRazorpay(body, null, RZP_SECRET), false);
  });

  test('verifies fresh Cashfree timestamped signature', () => {
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', amount: 200 });
    const currentTs = Math.floor(Date.now() / 1000).toString();
    const dataToSign = `${currentTs}${body}`;
    const sig = crypto.createHmac('sha256', CF_SECRET).update(dataToSign).digest('base64');

    const result = verifyCashfree(body, currentTs, sig, CF_SECRET);
    assert.equal(result.valid, true);
  });

  test('rejects replayed / stale Cashfree webhook older than 5 minutes', () => {
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', amount: 200 });
    const staleTs = Math.floor((Date.now() - 10 * 60 * 1000) / 1000).toString(); // 10 minutes ago
    const dataToSign = `${staleTs}${body}`;
    const sig = crypto.createHmac('sha256', CF_SECRET).update(dataToSign).digest('base64');

    const result = verifyCashfree(body, staleTs, sig, CF_SECRET);
    assert.equal(result.valid, false);
    assert.equal(result.error, 'Timestamp expired');
  });

  test('rejects missing Cashfree timestamp header', () => {
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
    const result = verifyCashfree(body, null, 'some_sig', CF_SECRET);
    assert.equal(result.valid, false);
    assert.equal(result.error, 'Missing headers');
  });
});

// ------------------------------------------------------------------------------
// 5. WebSocket Merchant Isolation & Authorization Tests
// ------------------------------------------------------------------------------
describe('5. WebSocket Merchant Isolation & Security', () => {
  // Registry map: merchantId -> Set of mock sockets
  const merchantRegistry = new Map();

  function registerClient(merchantId, client) {
    if (!merchantRegistry.has(merchantId)) {
      merchantRegistry.set(merchantId, new Set());
    }
    merchantRegistry.get(merchantId).add(client);
  }

  function dispatchPayment(targetMerchantId, paymentData) {
    const targets = merchantRegistry.get(targetMerchantId) || new Set();
    const deliveredClients = [];
    for (const client of targets) {
      client.received.push({ ...paymentData, targetMerchantId });
      deliveredClients.push(client.id);
    }
    return deliveredClients;
  }

  test('merchant A receives payment intended for merchant A', () => {
    const clientA = { id: 'client_A', received: [] };
    registerClient('merchant_123', clientA);

    const delivered = dispatchPayment('merchant_123', { amount: 500, source: 'Razorpay UPI' });
    assert.deepEqual(delivered, ['client_A']);
    assert.equal(clientA.received.length, 1);
    assert.equal(clientA.received[0].amount, 500);
  });

  test('merchant B NEVER receives payments intended for merchant A (Isolation Guarantee)', () => {
    const clientA = { id: 'client_A', received: [] };
    const clientB = { id: 'client_B', received: [] };

    registerClient('merchant_alpha', clientA);
    registerClient('merchant_beta', clientB);

    // Send payment for Alpha
    dispatchPayment('merchant_alpha', { amount: 1200, source: 'Cashfree UPI' });

    assert.equal(clientA.received.length, 1);
    assert.equal(clientB.received.length, 0); // Merchant B has 0 received payments
  });
});

// ------------------------------------------------------------------------------
// 6. Administrative & Simulation Route Authentication
// ------------------------------------------------------------------------------
describe('6. Admin & Simulation Endpoint Security', () => {
  const SERVER_ADMIN_KEY = 'super_secret_admin_api_token_xyz_9988';

  function authenticateAdmin(providedHeader) {
    if (!providedHeader || typeof providedHeader !== 'string') return false;
    const bufA = Buffer.from(providedHeader);
    const bufB = Buffer.from(SERVER_ADMIN_KEY);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  test('rejects request with missing x-admin-key', () => {
    assert.equal(authenticateAdmin(undefined), false);
    assert.equal(authenticateAdmin(''), false);
  });

  test('rejects request with invalid x-admin-key', () => {
    assert.equal(authenticateAdmin('invalid_guess_123'), false);
  });

  test('accepts request with valid matching x-admin-key', () => {
    assert.equal(authenticateAdmin(SERVER_ADMIN_KEY), true);
  });
});
