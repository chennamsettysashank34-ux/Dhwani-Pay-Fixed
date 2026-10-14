import crypto from 'crypto';

export interface CreateQrParams {
  amount: number;
  customerName?: string;
  notes?: string;
  provider: 'razorpay' | 'cashfree';
}

export interface QrResponse {
  provider: 'razorpay' | 'cashfree';
  qrId: string;
  qrPayload: string; // The UPI deep link or QR string to encode
  amount: number;
  isMock: boolean;
  expiresAt: string;
}

/**
 * Creates a Dynamic UPI QR Code via Razorpay's QR Codes API:
 * POST https://api.razorpay.com/v1/payments/qr_codes
 */
export async function createRazorpayQr(
  params: CreateQrParams,
  keyId?: string,
  keySecret?: string
): Promise<QrResponse> {
  const { amount, customerName, notes } = params;
  const amountInPaise = Math.round(amount * 100);

  // If real keys are provided, call Razorpay API directly
  if (keyId && keySecret && !keyId.startsWith('dummy')) {
    try {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          type: 'upi_qr',
          name: customerName || 'DhwaniPay Store Counter',
          usage: 'single_use',
          fixed_amount: true,
          payment_amount: amountInPaise,
          description: notes || 'Counter Bill',
          notes: {
            app: 'dhwanipay',
            created_at: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Razorpay API Error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      return {
        provider: 'razorpay',
        qrId: data.id,
        qrPayload: data.image_url || `upi://pay?pa=rzp.${data.id}@icici&pn=RazorpayMerchant&am=${amount.toFixed(2)}&cu=INR`,
        amount,
        isMock: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    } catch (err: any) {
      console.warn('[Razorpay API] Live call failed:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Razorpay gateway error: ${err.message}`);
      }
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Razorpay credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured.');
  }

  // Sandbox / Simulation Fallback (strictly in non-production/development)
  const mockQrId = `qr_rzp_${Date.now().toString(36)}`;
  const mockUpiPayload = `upi://pay?pa=razorpay.merchant@icici&pn=DhwaniPay%20Store&am=${amount.toFixed(2)}&cu=INR&tr=${mockQrId}&tn=BillPayment`;

  return {
    provider: 'razorpay',
    qrId: mockQrId,
    qrPayload: mockUpiPayload,
    amount,
    isMock: true,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/**
 * Creates a Dynamic UPI Order via Cashfree PG API:
 * POST https://sandbox.cashfree.com/pg/orders
 */
export async function createCashfreeQr(
  params: CreateQrParams,
  appId?: string,
  secretKey?: string,
  isProd: boolean = false
): Promise<QrResponse> {
  const { amount, customerName, notes } = params;
  const baseUrl = isProd
    ? 'https://api.cashfree.com/pg/orders'
    : 'https://sandbox.cashfree.com/pg/orders';

  if (appId && secretKey && !appId.startsWith('dummy')) {
    try {
      const orderId = `cf_order_${Date.now()}`;
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: `cust_${Date.now().toString().slice(-6)}`,
            customer_name: customerName || 'Store Customer',
            customer_phone: '9999999999',
          },
          order_meta: {
            notify_url: 'https://api.dhwanipay.in/api/webhooks/cashfree',
          },
          order_note: notes || 'Counter Bill',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cashfree API Error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      return {
        provider: 'cashfree',
        qrId: data.order_id,
        qrPayload: `upi://pay?pa=cashfree.merchant@yesbank&pn=CashfreeMerchant&am=${amount.toFixed(2)}&cu=INR&tr=${data.order_id}`,
        amount,
        isMock: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    } catch (err: any) {
      console.warn('[Cashfree API] Live call failed:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Cashfree gateway error: ${err.message}`);
      }
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('Cashfree credentials (CASHFREE_APP_ID & CASHFREE_SECRET_KEY) are not configured.');
  }

  // Sandbox / Simulation Fallback (strictly in non-production/development)
  const mockOrderId = `cf_mock_${Date.now().toString(36)}`;
  const mockUpiPayload = `upi://pay?pa=cashfree.merchant@yesbank&pn=DhwaniPay%20Store&am=${amount.toFixed(2)}&cu=INR&tr=${mockOrderId}&tn=CounterPayment`;

  return {
    provider: 'cashfree',
    qrId: mockOrderId,
    qrPayload: mockUpiPayload,
    amount,
    isMock: true,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}
