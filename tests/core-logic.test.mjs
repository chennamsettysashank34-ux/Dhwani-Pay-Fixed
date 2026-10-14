import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

describe('UPI Deep Link URI Generator', () => {
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
    });

    assert.ok(uri.startsWith('upi://pay?'));
    assert.ok(uri.includes('pa=merchant%40okhdfcbank'));
    assert.ok(uri.includes('pn=Sharma%20General%20Store'));
    assert.ok(uri.includes('am=150.00'));
    assert.ok(uri.includes('cu=INR'));
    assert.ok(uri.includes('tn=Groceries%20bill'));
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

describe('Indian UPI Notification Regex Extraction', () => {
  const AMOUNT_PATTERN = /(?:received|credited|received\s+payment\s+of|payment\s+of)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const FALLBACK_AMOUNT = /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const PAYER_PATTERN = /(?:from|by)\s+([a-zA-Z\s]{2,30}?)(?=\s+(?:on|via|with|using|through|in|at)\b|[.,(]|\s*$)/i;
  const UTR_PATTERN = /(?:utr|ref(?:erence)?\s*(?:no|id)?|txn\s*id)[\s:]*([0-9]{8,16})/i;

  function extractPayment(text) {
    const amountMatch = text.match(AMOUNT_PATTERN) || text.match(FALLBACK_AMOUNT);
    const payerMatch = text.match(PAYER_PATTERN);
    const utrMatch = text.match(UTR_PATTERN);

    return {
      amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null,
      payer: payerMatch ? payerMatch[1].trim() : null,
      utr: utrMatch ? utrMatch[1].trim() : null,
    };
  }

  test('extracts payment from PhonePe notification', () => {
    const text = 'Received payment of Rs. 250.00 from Rahul Sharma via PhonePe. UTR: 328901847192';
    const result = extractPayment(text);
    assert.equal(result.amount, 250.0);
    assert.equal(result.payer, 'Rahul Sharma');
    assert.equal(result.utr, '328901847192');
  });

  test('extracts payment from Google Pay notification', () => {
    const text = '₹500.00 received from Sunita Verma on Google Pay';
    const result = extractPayment(text);
    assert.equal(result.amount, 500.0);
    assert.equal(result.payer, 'Sunita Verma');
  });

  test('extracts payment from Paytm merchant notification', () => {
    const text = 'Payment of ₹1,250 received by Amit Kumar on Paytm QR. Ref: 987654321012';
    const result = extractPayment(text);
    assert.equal(result.amount, 1250.0);
    assert.equal(result.payer, 'Amit Kumar');
    assert.equal(result.utr, '987654321012');
  });

  test('handles comma-separated high-value amounts', () => {
    const text = 'Credited Rs. 15,400.50 from Rajesh Textiles via NEFT/UPI';
    const result = extractPayment(text);
    assert.equal(result.amount, 15400.5);
    assert.equal(result.payer, 'Rajesh Textiles');
  });

  test('extracts payer at end of notification without trailing provider', () => {
    const text = 'Payment of Rs 100 received from Anita Roy';
    const result = extractPayment(text);
    assert.equal(result.amount, 100.0);
    assert.equal(result.payer, 'Anita Roy');
  });

  test('extracts payer when followed by punctuation', () => {
    const text = 'Rs. 200 credited from Rohan Patel.';
    const result = extractPayment(text);
    assert.equal(result.amount, 200.0);
    assert.equal(result.payer, 'Rohan Patel');
  });
});

describe('Webhook HMAC-SHA256 Signature Verification', () => {
  const SECRET = 'test_webhook_secret_key_123';

  function verifyRazorpaySignature(payload, signature, secret) {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return signature === expected;
  }

  function verifyCashfreeSignature(payload, timestamp, signature, secret) {
    const dataToSign = `${timestamp}${payload}`;
    const expected = crypto.createHmac('sha256', secret).update(dataToSign).digest('base64');
    return signature === expected;
  }

  test('verifies valid Razorpay HMAC hex signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured', amount: 50000 });
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    assert.ok(verifyRazorpaySignature(payload, signature, SECRET));
  });

  test('rejects tampered Razorpay payload', () => {
    const payload = JSON.stringify({ event: 'payment.captured', amount: 50000 });
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const tampered = JSON.stringify({ event: 'payment.captured', amount: 500 });
    assert.equal(verifyRazorpaySignature(tampered, signature, SECRET), false);
  });

  test('verifies valid Cashfree timestamped base64 signature', () => {
    const payload = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' });
    const timestamp = '1697200000';
    const dataToSign = `${timestamp}${payload}`;
    const signature = crypto.createHmac('sha256', SECRET).update(dataToSign).digest('base64');
    assert.ok(verifyCashfreeSignature(payload, timestamp, signature, SECRET));
  });
});
