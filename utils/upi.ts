import { Linking } from 'react-native';

export interface UpiPaymentParams {
  /** Virtual Payment Address (e.g. merchant@okhdfcbank or 9876543210@paytm) */
  vpa: string;
  /** Payee / Merchant Name (e.g. Sharma General Store) */
  payeeName: string;
  /** Optional transaction amount in INR */
  amount?: number;
  /** Optional transaction note / bill description */
  note?: string;
  /** Optional transaction reference / invoice ID */
  transactionRef?: string;
  /** Merchant Category Code (default: 5411 for grocery/general retail) */
  mcc?: string;
}

/**
 * Builds an official NPCI standard UPI Deep Link URL:
 * upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<ref>&mc=<mcc>
 */
export function buildUpiUri(params: UpiPaymentParams): string {
  const { vpa, payeeName, amount, note, transactionRef, mcc } = params;

  if (!vpa || !vpa.includes('@')) {
    throw new Error('A valid UPI ID (e.g. yourname@upi) is required.');
  }

  const queryParts: string[] = [];

  queryParts.push(`pa=${encodeURIComponent(vpa.trim())}`);
  queryParts.push(`pn=${encodeURIComponent(payeeName.trim() || 'Merchant')}`);
  queryParts.push(`cu=INR`);

  if (amount && amount > 0) {
    // Format to 2 decimal places as per NPCI specs
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

/**
 * Attempts to launch any installed UPI app on Android / iOS with the payment URI
 */
export async function launchUpiIntent(upiUri: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(upiUri);
    if (canOpen) {
      await Linking.openURL(upiUri);
      return true;
    } else {
      // Direct open attempt (some Android OEM intent resolvers allow open even if canOpen returns false)
      await Linking.openURL(upiUri);
      return true;
    }
  } catch (error) {
    console.warn('Unable to launch UPI app via intent:', error);
    return false;
  }
}

/**
 * Formats amount into Indian currency format (e.g. ₹1,25,000)
 */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
