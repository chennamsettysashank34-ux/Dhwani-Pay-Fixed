export type EventState = 'Played' | 'Pending' | 'Failed';

export type PaymentEvent = {
  id: string;
  amount?: number;
  source: string;
  time: string;
  date?: string; // YYYY-MM-DD
  timestamp?: number;
  state: EventState;
  note?: string;
  payerName?: string;
  utr?: string;
  simulated?: boolean;
};

export type PermissionState = 'not-granted' | 'enabled' | 'revoked' | 'unknown';

export type ExpenseCategory =
  | 'Inventory'
  | 'Food & Tea'
  | 'Utilities'
  | 'Rent'
  | 'Salary'
  | 'Supplies'
  | 'Other';

export type ExpenseStatus = 'done' | 'pending';

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  status: ExpenseStatus; // 'done' (Paid/Settled) or 'pending' (Due/Unpaid)
  note?: string;
  paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
};

export type MerchantProfile = {
  vpa: string;
  businessName: string;
  mcc: string;
  phone?: string;
  gatewayUrl: string;
  mode: 'notification-listener' | 'cloud-webhook';
  isOnboarded?: boolean;
};

export type QRVaultApp =
  | 'PhonePe'
  | 'Google Pay'
  | 'Paytm'
  | 'BharatPe'
  | 'BHIM UPI'
  | 'Amazon Pay'
  | 'CRED'
  | 'Bank QR'
  | 'Other';

export interface VaultQRCode {
  id: string;
  appName: QRVaultApp;
  title: string;
  imageUri?: string;
  vpa?: string;
  createdAt: string;
  isPrimary?: boolean;
}

export type SupportedLanguage = {
  name: string;
  nativeName: string;
  code: string;
};

export interface UserAccount {
  id: string;
  email: string;
  createdAt: string;
}
