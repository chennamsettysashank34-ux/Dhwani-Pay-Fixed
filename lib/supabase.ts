import Constants from 'expo-constants';
import { storage } from '@/utils/storage';

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    business_name?: string;
    vpa?: string;
    spoken_language?: string;
  };
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  user: SupabaseUser;
}

export interface MerchantRecord {
  id: string;
  user_id: string;
  email: string;
  business_name: string;
  vpa: string;
  phone?: string;
  spoken_language: string;
  interface_language?: string;
  announcements_enabled: boolean;
  speech_rate: number;
  created_at: string;
}

export interface CloudPaymentEvent {
  id: string;
  merchant_id: string;
  amount: number;
  source: string;
  payer_name?: string;
  utr?: string;
  note?: string;
  state: 'Played' | 'Pending' | 'Failed';
  raw_notification?: string;
  created_at: string;
}

export interface CloudExpense {
  id: string;
  merchant_id: string;
  title: string;
  amount: number;
  category: string;
  status: 'done' | 'pending';
  payment_method: string;
  date: string;
  note?: string;
  created_at: string;
}

export interface CloudVaultQR {
  id: string;
  merchant_id: string;
  app_name: string;
  title: string;
  image_uri: string;
  vpa?: string;
  is_primary: boolean;
  created_at: string;
}

// Storage keys
const SESSION_STORAGE_KEY = 'dhwanipay_supabase_session';
const CONFIG_STORAGE_KEY = 'dhwanipay_supabase_config';

function getExtraConfig(): { supabaseUrl?: string; supabaseAnonKey?: string } {
  try {
    const extra =
      Constants.expoConfig?.extra ||
      (Constants as any).manifest2?.extra?.expoClient?.extra ||
      (Constants as any).manifest?.extra ||
      {};
    return {
      supabaseUrl: extra.supabaseUrl || extra.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: extra.supabaseAnonKey || extra.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    };
  } catch {
    return {};
  }
}

const extraConfig = getExtraConfig();

let supabaseUrl = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  extraConfig.supabaseUrl ||
  ''
).trim();

let supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  extraConfig.supabaseAnonKey ||
  ''
).trim();

// Initialize configuration from persistent storage if saved
export async function initSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  try {
    const saved = await storage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && typeof parsed.url === 'string' && parsed.url.trim()) {
        supabaseUrl = parsed.url.trim().replace(/\/+$/, '');
      }
      if (parsed.anonKey && typeof parsed.anonKey === 'string' && parsed.anonKey.trim()) {
        supabaseAnonKey = parsed.anonKey.trim();
      }
    }
  } catch (e) {
    console.warn('Failed to load Supabase config', e);
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

export async function saveSupabaseConfig(url: string, anonKey: string): Promise<void> {
  supabaseUrl = url.trim().replace(/\/+$/, '');
  supabaseAnonKey = anonKey.trim();
  await storage.setItem(
    CONFIG_STORAGE_KEY,
    JSON.stringify({ url: supabaseUrl, anonKey: supabaseAnonKey })
  );
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

// Check if connecting to a real user-supplied Supabase project
export function isRealSupabaseConfigured(): boolean {
  return (
    supabaseUrl.length > 10 &&
    /^https?:\/\//i.test(supabaseUrl) &&
    supabaseAnonKey.length > 20
  );
}

/**
 * Test connectivity & API key validity against the configured Supabase instance
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customAnonKey?: string
): Promise<{ ok: boolean; message: string }> {
  const targetUrl = (customUrl ?? supabaseUrl).trim().replace(/\/+$/, '');
  const targetKey = (customAnonKey ?? supabaseAnonKey).trim();

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return { ok: false, message: 'Please enter a valid https://<project>.supabase.co URL.' };
  }
  if (!targetKey || targetKey.length < 20) {
    return { ok: false, message: 'Please enter a valid Supabase anon public key.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${targetUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: targetKey,
        Authorization: `Bearer ${targetKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { ok: true, message: 'Connected to Supabase Auth & PostgreSQL successfully.' };
    }
    return {
      ok: false,
      message: `Supabase responded with status ${res.status}. Verify your Project URL and Anon Key.`,
    };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message || 'Unable to reach Supabase server. Check internet connection and URL.',
    };
  }
}

const isJwtToken = (token?: string): boolean =>
  typeof token === 'string' && token.split('.').length === 3 && !token.startsWith('mock_');

/**
 * Normalize expires_at to Unix seconds
 */
function normalizeExpiresAt(rawExpiresAt?: number, expiresIn?: number): number {
  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof rawExpiresAt === 'number' && rawExpiresAt > 0) {
    // Convert ms to seconds if needed
    return rawExpiresAt > 10_000_000_000 ? Math.floor(rawExpiresAt / 1000) : rawExpiresAt;
  }
  if (typeof expiresIn === 'number' && expiresIn > 0) {
    return nowSec + expiresIn;
  }
  return nowSec + 3600 * 24 * 7;
}

/**
 * Attempt to refresh an expired session using the stored refresh token.
 */
async function refreshSessionIfExpired(session: SupabaseSession): Promise<SupabaseSession | null> {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = normalizeExpiresAt(session.expires_at);

  // Check if token is still valid (with 60s buffer)
  if (expSec > nowSec + 60) {
    return session;
  }

  if (!session.refresh_token || !isRealSupabaseConfigured() || !isJwtToken(session.access_token)) {
    return session;
  }

  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (!res.ok) return session;

    const data = await res.json();
    if (!data.access_token) return session;

    const refreshed: SupabaseSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || session.refresh_token,
      expires_at: normalizeExpiresAt(data.expires_at, data.expires_in),
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          }
        : session.user,
    };

    await setStoredSession(refreshed);
    return refreshed;
  } catch (e) {
    console.warn('Token refresh failed:', e);
    return session;
  }
}

// Low-level fetch wrapper with Auth, token refresh, and API key headers
async function supabaseFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let session = await getStoredSession();

  if (session) {
    session = await refreshSessionIfExpired(session);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only send Bearer token if it is a valid JWT (or fallback to anon key for PostgREST)
  if (session?.access_token && isJwtToken(session.access_token)) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else if (supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  const targetUrl = `${cleanUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  return fetch(targetUrl, {
    ...options,
    headers,
  });
}

// ==============================================================================
// AUTHENTICATION APIs
// ==============================================================================

async function getStoredSession(): Promise<SupabaseSession | null> {
  try {
    const raw = await storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setStoredSession(session: SupabaseSession | null): Promise<void> {
  if (session) {
    await storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    await storage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Real Email & Password Sign Up via Supabase GoTrue Auth (with offline local fallback)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: { businessName: string; vpa: string; spokenLanguage?: string }
): Promise<{ user: SupabaseUser | null; session: SupabaseSession | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isRealSupabaseConfigured()) {
    try {
      const res = await supabaseFetch('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
          data: {
            business_name: metadata.businessName,
            vpa: metadata.vpa,
            spoken_language: metadata.spokenLanguage || 'English',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          user: null,
          session: null,
          error:
            data.error_description ||
            data.msg ||
            data.message ||
            'Registration failed. Please check your credentials.',
        };
      }

      const rawUser = data.user || (data.id ? data : null);
      if (!rawUser) {
        return {
          user: null,
          session: null,
          error: 'No user record returned from Supabase.',
        };
      }

      const user: SupabaseUser = {
        id: rawUser.id,
        email: rawUser.email || cleanEmail,
        user_metadata: rawUser.user_metadata || {
          business_name: metadata.businessName,
          vpa: metadata.vpa,
          spoken_language: metadata.spokenLanguage || 'English',
        },
      };

      const accessToken = data.access_token || data.session?.access_token;
      const refreshToken = data.refresh_token || data.session?.refresh_token;

      // If GoTrue returned a valid JWT immediately (Email Confirmation disabled), store session
      if (accessToken && isJwtToken(accessToken)) {
        const session: SupabaseSession = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_at: normalizeExpiresAt(
            data.expires_at || data.session?.expires_at,
            data.expires_in || data.session?.expires_in
          ),
          user,
        };
        await setStoredSession(session);
        return { user, session, error: undefined };
      }

      // Otherwise attempt immediate password sign-in in case auto-confirm is active
      const signInAttempt = await signInWithEmail(cleanEmail, password);
      if (signInAttempt.user && signInAttempt.session) {
        return signInAttempt;
      }

      return {
        user: null,
        session: null,
        error:
          'Account created! Please check your email inbox to confirm your email address (or disable "Confirm email" in Supabase Auth > Providers > Email), then Sign In.',
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        error: err.message || 'Network error connecting to Supabase',
      };
    }
  }

  // Offline / Local device ledger mode when Supabase URL is not yet configured
  const mockUser: SupabaseUser = {
    id: `usr_${Date.now()}`,
    email: cleanEmail,
    user_metadata: {
      business_name: metadata.businessName,
      vpa: metadata.vpa,
      spoken_language: metadata.spokenLanguage || 'English',
    },
  };

  const mockSession: SupabaseSession = {
    access_token: `mock_jwt_${Date.now()}`,
    refresh_token: `mock_refresh_${Date.now()}`,
    expires_at: normalizeExpiresAt(),
    user: mockUser,
  };

  await setStoredSession(mockSession);
  return { user: mockUser, session: mockSession, error: undefined };
}

/**
 * Real Email & Password Sign In via Supabase GoTrue Auth (with offline local fallback)
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: SupabaseUser | null; session: SupabaseSession | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isRealSupabaseConfigured()) {
    try {
      const res = await supabaseFetch('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          user: null,
          session: null,
          error:
            data.error_description ||
            data.msg ||
            data.message ||
            'Invalid email or password',
        };
      }

      const rawUser = data.user || (data.id ? data : null);
      const accessToken = data.access_token || data.session?.access_token;
      if (!rawUser || !accessToken) {
        return {
          user: null,
          session: null,
          error: 'No valid session token received from Supabase.',
        };
      }

      const user: SupabaseUser = {
        id: rawUser.id,
        email: rawUser.email || cleanEmail,
        user_metadata: rawUser.user_metadata || {},
      };

      const session: SupabaseSession = {
        access_token: accessToken,
        refresh_token: data.refresh_token || data.session?.refresh_token || '',
        expires_at: normalizeExpiresAt(
          data.expires_at || data.session?.expires_at,
          data.expires_in || data.session?.expires_in
        ),
        user,
      };

      await setStoredSession(session);
      return { user, session, error: undefined };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        error: err.message || 'Network error connecting to Supabase',
      };
    }
  }

  // Offline / Local device ledger mode when Supabase URL is not yet configured
  const mockUser: SupabaseUser = {
    id: `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
    email: cleanEmail,
    user_metadata: {
      business_name: cleanEmail.split('@')[0],
      vpa: `${cleanEmail.split('@')[0]}@okhdfcbank`,
      spoken_language: 'English',
    },
  };

  const mockSession: SupabaseSession = {
    access_token: `mock_jwt_${Date.now()}`,
    refresh_token: `mock_refresh_${Date.now()}`,
    expires_at: normalizeExpiresAt(),
    user: mockUser,
  };

  await setStoredSession(mockSession);
  return { user: mockUser, session: mockSession, error: undefined };
}

/**
 * Sign Out
 */
export async function signOutUser(): Promise<void> {
  const session = await getStoredSession();
  await setStoredSession(null);

  if (isRealSupabaseConfigured() && session?.access_token && isJwtToken(session.access_token)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      await fetch(`${cleanUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      }).catch(() => {});
      clearTimeout(timeoutId);
    } catch {
      // Ignored
    }
  }
}

/**
 * Get active session
 */
export async function getCurrentSession(): Promise<SupabaseSession | null> {
  return getStoredSession();
}

// ==============================================================================
// DATABASE (POSTGREST) APIS
// ==============================================================================

const isUUID = (str?: string): boolean =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Fetch merchant profile from `public.merchants`
 */
export async function fetchMerchantProfile(userId: string): Promise<MerchantRecord | null> {
  if (!isRealSupabaseConfigured() || !isUUID(userId)) return null;

  try {
    const res = await supabaseFetch(`/rest/v1/merchants?user_id=eq.${userId}&select=*`, {
      method: 'GET',
    });
    if (res.ok) {
      const rows = await res.json();
      return rows[0] || null;
    }
  } catch (e) {
    console.warn('Failed to fetch merchant profile', e);
  }
  return null;
}

/**
 * Ensure merchant record exists in public.merchants and return it
 */
export async function ensureMerchantRecord(user: SupabaseUser): Promise<MerchantRecord | null> {
  if (!isRealSupabaseConfigured() || !isUUID(user?.id)) return null;

  try {
    const existing = await fetchMerchantProfile(user.id);
    if (existing) return existing;

    const res = await supabaseFetch('/rest/v1/merchants', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        business_name: user.user_metadata?.business_name || 'My Store',
        vpa: user.user_metadata?.vpa || 'merchant@upi',
        spoken_language: user.user_metadata?.spoken_language || 'English',
      }),
    });
    if (res.ok) {
      const rows = await res.json();
      return rows[0] || null;
    }
  } catch (e) {
    console.warn('Failed to ensure merchant record', e);
  }
  return null;
}

/**
 * Update merchant settings in `public.merchants`
 */
export async function updateMerchantInCloud(
  merchantId: string,
  updates: {
    business_name?: string;
    vpa?: string;
    spoken_language?: string;
    interface_language?: string;
    announcements_enabled?: boolean;
  }
): Promise<boolean> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId)) return false;

  try {
    const res = await supabaseFetch(`/rest/v1/merchants?id=eq.${merchantId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to update merchant in Supabase', e);
    return false;
  }
}

/**
 * Fetch payments from public.payment_events for a merchant
 */
export async function fetchCloudPayments(merchantId: string): Promise<CloudPaymentEvent[]> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId)) return [];

  try {
    const res = await supabaseFetch(
      `/rest/v1/payment_events?merchant_id=eq.${merchantId}&order=created_at.desc&limit=50`,
      { method: 'GET' }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to fetch payments from Supabase', e);
  }
  return [];
}

/**
 * Fetch expenses from public.expenses for a merchant
 */
export async function fetchCloudExpenses(merchantId: string): Promise<CloudExpense[]> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId)) return [];

  try {
    const res = await supabaseFetch(
      `/rest/v1/expenses?merchant_id=eq.${merchantId}&order=created_at.desc&limit=50`,
      { method: 'GET' }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to fetch expenses from Supabase', e);
  }
  return [];
}

/**
 * Sync / insert incoming payment from Android Notification Listener into `public.payment_events`
 */
export async function insertPaymentToCloud(payment: {
  merchantId: string;
  amount: number;
  source: string;
  payerName?: string;
  utr?: string;
  state?: 'Played' | 'Pending' | 'Failed';
  rawNotification?: string;
}): Promise<CloudPaymentEvent | null> {
  if (!isRealSupabaseConfigured() || !isUUID(payment.merchantId)) return null;

  try {
    const res = await supabaseFetch('/rest/v1/payment_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        merchant_id: payment.merchantId,
        amount: payment.amount,
        source: payment.source,
        payer_name: payment.payerName || null,
        utr: payment.utr || null,
        state: payment.state || 'Played',
        raw_notification: payment.rawNotification || null,
      }),
    });
    if (res.ok) {
      const rows = await res.json();
      return rows[0] || null;
    }
  } catch (e) {
    console.warn('Failed to sync payment event to Supabase', e);
  }
  return null;
}

/**
 * Sync / insert expense into `public.expenses`
 */
export async function insertExpenseToCloud(expense: {
  merchantId: string;
  title: string;
  amount: number;
  category: string;
  status: 'done' | 'pending';
  paymentMethod: string;
  date: string;
  note?: string;
}): Promise<CloudExpense | null> {
  if (!isRealSupabaseConfigured() || !isUUID(expense.merchantId)) return null;

  try {
    const res = await supabaseFetch('/rest/v1/expenses', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        merchant_id: expense.merchantId,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        status: expense.status,
        payment_method: expense.paymentMethod,
        date: expense.date,
        note: expense.note || null,
      }),
    });
    if (res.ok) {
      const rows = await res.json();
      return rows[0] || null;
    }
  } catch (e) {
    console.warn('Failed to sync expense to Supabase', e);
  }
  return null;
}

/**
 * Update expense status/fields in `public.expenses`
 */
export async function updateExpenseInCloud(
  merchantId: string,
  expenseId: string,
  updates: Partial<{ status: 'done' | 'pending'; title: string; amount: number; note: string }>
): Promise<boolean> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId) || !isUUID(expenseId)) return false;

  try {
    const res = await supabaseFetch(
      `/rest/v1/expenses?id=eq.${expenseId}&merchant_id=eq.${merchantId}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(updates),
      }
    );
    return res.ok;
  } catch (e) {
    console.warn('Failed to update expense in Supabase', e);
    return false;
  }
}

/**
 * Delete expense from `public.expenses`
 */
export async function deleteExpenseFromCloud(
  merchantId: string,
  expenseId: string
): Promise<boolean> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId) || !isUUID(expenseId)) return false;

  try {
    const res = await supabaseFetch(
      `/rest/v1/expenses?id=eq.${expenseId}&merchant_id=eq.${merchantId}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch (e) {
    console.warn('Failed to delete expense from Supabase', e);
    return false;
  }
}

/**
 * Fetch saved QR standees from `public.vault_qrs`
 */
export async function fetchCloudVaultQRs(merchantId: string): Promise<CloudVaultQR[]> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId)) return [];

  try {
    const res = await supabaseFetch(
      `/rest/v1/vault_qrs?merchant_id=eq.${merchantId}&order=created_at.desc`,
      { method: 'GET' }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to fetch vault QRs from Supabase', e);
  }
  return [];
}

/**
 * Upsert QR standee into `public.vault_qrs`
 */
export async function upsertVaultQRToCloud(
  merchantId: string,
  qr: {
    id: string;
    appName: string;
    title: string;
    imageUri: string;
    vpa?: string;
    isPrimary?: boolean;
  }
): Promise<boolean> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId)) return false;

  try {
    const res = await supabaseFetch('/rest/v1/vault_qrs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify({
        id: qr.id,
        merchant_id: merchantId,
        app_name: qr.appName,
        title: qr.title,
        image_uri: qr.imageUri,
        vpa: qr.vpa || null,
        is_primary: Boolean(qr.isPrimary),
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Failed to upsert vault QR to Supabase', e);
    return false;
  }
}

/**
 * Delete QR standee from `public.vault_qrs`
 */
export async function deleteVaultQRFromCloud(
  merchantId: string,
  qrId: string
): Promise<boolean> {
  if (!isRealSupabaseConfigured() || !isUUID(merchantId)) return false;

  try {
    const res = await supabaseFetch(
      `/rest/v1/vault_qrs?id=eq.${encodeURIComponent(qrId)}&merchant_id=eq.${merchantId}`,
      { method: 'DELETE' }
    );
    return res.ok;
  } catch (e) {
    console.warn('Failed to delete vault QR from Supabase', e);
    return false;
  }
}
