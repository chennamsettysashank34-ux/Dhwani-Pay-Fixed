export interface UpiPaymentParams {
  vpa: string;
  payeeName: string;
  amount?: number;
  note?: string;
  transactionRef?: string;
  mcc?: string;
}

export function buildUpiUri(params: UpiPaymentParams): string {
  const { vpa, payeeName, amount, note, transactionRef, mcc } = params;

  if (!vpa || !vpa.includes('@')) {
    throw new Error('A valid UPI ID (e.g. yourname@upi) is required.');
  }

  const queryParts: string[] = [];
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

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
