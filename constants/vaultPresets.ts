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
  imageUri: string;
  vpa?: string;
  createdAt: string;
  isPrimary?: boolean;
}

export interface AppPreset {
  appName: QRVaultApp;
  brandColor: string;
  bgLight: string;
  textColor: string;
  tagline: string;
  defaultTitle: string;
  sampleVpa: string;
}

export const APP_PRESETS: Record<QRVaultApp, AppPreset> = {
  PhonePe: {
    appName: 'PhonePe',
    brandColor: '#5F259F',
    bgLight: '#F3E8FF',
    textColor: '#5F259F',
    tagline: 'PhonePe Merchant QR',
    defaultTitle: 'PhonePe Counter Standee',
    sampleVpa: 'merchant@ybl',
  },
  'Google Pay': {
    appName: 'Google Pay',
    brandColor: '#1A73E8',
    bgLight: '#E8F0FE',
    textColor: '#1A73E8',
    tagline: 'Google Pay for Business',
    defaultTitle: 'GPay Shop Standee',
    sampleVpa: 'merchant@okaxis',
  },
  Paytm: {
    appName: 'Paytm',
    brandColor: '#002E6E',
    bgLight: '#E0F2FE',
    textColor: '#002E6E',
    tagline: 'Paytm All-In-One QR',
    defaultTitle: 'Paytm Soundbox QR',
    sampleVpa: 'merchant@paytm',
  },
  BharatPe: {
    appName: 'BharatPe',
    brandColor: '#00AE70',
    bgLight: '#DCFCE7',
    textColor: '#00875A',
    tagline: 'BharatPe 0% MDR Standee',
    defaultTitle: 'BharatPe QR Standee',
    sampleVpa: 'merchant@bharatpe',
  },
  'BHIM UPI': {
    appName: 'BHIM UPI',
    brandColor: '#F26522',
    bgLight: '#FFEDD5',
    textColor: '#C2410C',
    tagline: 'NPCI BHIM Official Standee',
    defaultTitle: 'BHIM Official Standee',
    sampleVpa: 'merchant@upi',
  },
  'Amazon Pay': {
    appName: 'Amazon Pay',
    brandColor: '#FF9900',
    bgLight: '#FEF3C7',
    textColor: '#B45309',
    tagline: 'Amazon Pay for Merchants',
    defaultTitle: 'Amazon Pay Standee',
    sampleVpa: 'merchant@apl',
  },
  CRED: {
    appName: 'CRED',
    brandColor: '#111827',
    bgLight: '#F3F4F6',
    textColor: '#111827',
    tagline: 'CRED Pay Merchant',
    defaultTitle: 'CRED Pay Standee',
    sampleVpa: 'merchant@cred',
  },
  'Bank QR': {
    appName: 'Bank QR',
    brandColor: '#0F5132',
    bgLight: '#D1E7DD',
    textColor: '#0F5132',
    tagline: 'Direct Bank Account Standee',
    defaultTitle: 'Bank Account Standee',
    sampleVpa: 'merchant@okhdfcbank',
  },
  Other: {
    appName: 'Other',
    brandColor: '#475569',
    bgLight: '#F1F5F9',
    textColor: '#334155',
    tagline: 'Custom UPI Standee',
    defaultTitle: 'Custom Counter QR',
    sampleVpa: 'merchant@upi',
  },
};

/**
 * Initial vault items for new users - empty by default so merchants upload/set their own
 */
export const INITIAL_VAULT_QRS: VaultQRCode[] = [];

