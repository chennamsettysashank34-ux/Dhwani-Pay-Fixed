/**
 * Canonical Notification Parser for Indian UPI Merchant Apps
 *
 * Implements strict extraction, negative filtering (debits, failures, cashback promos),
 * and transaction reference normalization.
 */

export interface ParsedPayment {
  amount: number | null;
  payer: string | null;
  utr: string | null;
  source: string;
  isCredit: boolean;
  isValid: boolean;
  rejectionReason?: string;
}

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

export function parsePaymentNotification(content: string, packageName = ''): ParsedPayment {
  const lower = content.toLowerCase();

  // 1. Negative Filtering
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        amount: null,
        payer: null,
        utr: null,
        source: getSourceName(packageName),
        isCredit: false,
        isValid: false,
        rejectionReason: `Matched negative keyword: ${keyword}`,
      };
    }
  }

  // 2. Positive credit confirmation
  const isCredit =
    lower.includes('received') ||
    lower.includes('credited') ||
    lower.includes('paid you') ||
    lower.includes('sent you');

  if (!isCredit) {
    return {
      amount: null,
      payer: null,
      utr: null,
      source: getSourceName(packageName),
      isCredit: false,
      isValid: false,
      rejectionReason: 'No credit phrase detected',
    };
  }

  // 3. Amount Extraction
  const amountMatch = content.match(AMOUNT_PATTERN) || content.match(FALLBACK_AMOUNT);
  let amount: number | null = null;
  if (amountMatch && amountMatch[1]) {
    const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1_000_000) {
      amount = parsed;
    }
  }

  if (amount === null) {
    return {
      amount: null,
      payer: null,
      utr: null,
      source: getSourceName(packageName),
      isCredit: true,
      isValid: false,
      rejectionReason: 'Invalid or missing amount',
    };
  }

  // 4. Payer Extraction
  const payerMatch = content.match(PAYER_PATTERN);
  const payer = payerMatch ? payerMatch[1].trim() : null;

  // 5. UTR Extraction
  const utrMatch = content.match(UTR_PATTERN);
  const utr = utrMatch ? utrMatch[1].trim() : null;

  return {
    amount,
    payer,
    utr,
    source: getSourceName(packageName),
    isCredit: true,
    isValid: true,
  };
}

export function getSourceName(packageName: string): string {
  switch (packageName) {
    case 'com.google.android.apps.nbu.paisa.merchant':
      return 'Google Pay for Business';
    case 'com.google.android.apps.nbu.paisa.user':
      return 'Google Pay';
    case 'com.phonepe.app.business':
      return 'PhonePe for Business';
    case 'com.phonepe.app':
      return 'PhonePe';
    case 'net.one97.paytm':
      return 'Paytm';
    case 'in.org.npci.upiapp':
      return 'BHIM UPI';
    case 'com.bharatpe.app':
      return 'BharatPe';
    default:
      return 'Bank UPI';
  }
}
