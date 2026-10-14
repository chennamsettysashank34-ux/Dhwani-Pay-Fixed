import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as Speech from 'expo-speech';
import { darkPalette, lightPalette, Palette, ThemeMode } from '@/constants/theme';
import { storage } from '@/utils/storage';
import {
  getCurrentSession,
  getSupabaseConfig,
  initSupabaseConfig,
  saveSupabaseConfig,
  insertExpenseToCloud,
  insertPaymentToCloud,
  updateExpenseInCloud,
  deleteExpenseFromCloud,
  updateMerchantInCloud,
  fetchCloudVaultQRs,
  upsertVaultQRToCloud,
  deleteVaultQRFromCloud,
  isRealSupabaseConfigured,
  signOutUser,
  SupabaseUser,
  ensureMerchantRecord,
  fetchCloudPayments,
  fetchCloudExpenses,
} from '@/lib/supabase';
import {
  addPaymentListener,
  isPermissionGranted,
  openPermissionSettings,
} from 'payment-listener';
import { VaultQRCode, QRVaultApp, INITIAL_VAULT_QRS } from '@/constants/vaultPresets';

export type { VaultQRCode, QRVaultApp };

export type EventState = 'Played' | 'Pending' | 'Failed';

export type PaymentEvent = {
  id: string;
  amount?: number;
  source: string;
  time: string;
  date?: string; // YYYY-MM-DD for date filtering
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
  gatewayUrl: string;
  mode: 'notification-listener' | 'cloud-webhook';
};

const defaultMerchantProfile: MerchantProfile = {
  vpa: '',
  businessName: '',
  mcc: '5411',
  gatewayUrl: '',
  mode: 'notification-listener',
};

const initialEvents: PaymentEvent[] = [];
const initialExpenses: Expense[] = [];

const EVENTS_STORAGE_KEY = 'dhwani_payment_events_v1';
const EXPENSES_STORAGE_KEY = 'dhwani_expenses_v1';
const PROFILE_STORAGE_KEY = 'dhwani_merchant_profile';
const VAULT_STORAGE_KEY = 'dhwani_qr_vault_v1';
const LANG_STORAGE_KEY = 'dhwani_spoken_language';

const languageCodes: Record<string, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Telugu: 'te-IN',
  Kannada: 'kn-IN',
  Tamil: 'ta-IN',
  Malayalam: 'ml-IN',
  Marathi: 'mr-IN',
};

type AppContextValue = {
  events: PaymentEvent[];
  expenses: Expense[];
  demoMode: boolean;
  announcementsEnabled: boolean;
  permissionState: PermissionState;
  spokenLanguage: string;
  interfaceLanguage: string;
  themeMode: ThemeMode;
  colors: Palette;
  isDark: boolean;
  merchantProfile: MerchantProfile;
  gatewayConnected: boolean;
  currentUser: SupabaseUser | null;
  authLoading: boolean;
  merchantCloudId: string | null;
  isCloudActive: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  configureSupabase: (url: string, anonKey: string) => Promise<void>;
  // Vault QR operations
  vaultQRs: VaultQRCode[];
  activeVaultQR: VaultQRCode | null;
  addVaultQR: (qr: Omit<VaultQRCode, 'id' | 'createdAt'>) => void;
  removeVaultQR: (id: string) => void;
  setActiveVaultQR: (id: string) => void;
  loginUser: (user: SupabaseUser) => void;
  logoutUser: () => Promise<void>;
  updateMerchantProfile: (updates: Partial<MerchantProfile>) => void;
  setDemoMode: (value: boolean) => void;
  setAnnouncementsEnabled: (value: boolean) => void;
  setPermissionState: (value: PermissionState) => void;
  checkNotificationPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  setSpokenLanguage: (value: string) => void;
  setInterfaceLanguage: (value: string) => void;
  setThemeMode: (value: ThemeMode) => void;
  // Expense operations
  addExpense: (expense: Omit<Expense, 'id'>, announce?: boolean) => void;
  removeExpense: (id: string) => void;
  toggleExpenseStatus: (id: string, announce?: boolean) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  speakExpense: (expense: Expense) => Promise<void>;
  // Payment operations
  addPaymentEvent: (amount: number, source?: string) => void;
  recordRealPayment: (amount: number, payerName?: string, source?: string, utr?: string) => void;
  speakPayment: (amount: number, source?: string, payerName?: string) => Promise<void>;
  // Backwards compatibility / test simulations & data clearing
  simulatePayment: (amount: number) => void;
  simulateFailure: () => void;
  simulateMissingPermission: () => void;
  simulatePermissionEnabled: () => void;
  resetDemo: () => void;
  exitDemoMode: () => void;
  clearEvents: () => void;
  clearExpenses: () => void;
  clearAllData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [events, setEvents] = useState<PaymentEvent[]>(initialEvents);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [vaultQRs, setVaultQRs] = useState<VaultQRCode[]>(INITIAL_VAULT_QRS);
  const [demoMode, setDemoMode] = useState(false);
  const [announcementsEnabled, _setAnnouncementsEnabled] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>('enabled');
  const [spokenLanguage, _setSpokenLanguage] = useState('English');
  const [interfaceLanguage, _setInterfaceLanguage] = useState('English');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(defaultMerchantProfile);
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [merchantCloudId, setMerchantCloudId] = useState<string | null>(null);
  const [supabaseConfigState, setSupabaseConfigState] = useState<{ url: string; anonKey: string }>(
    () => getSupabaseConfig()
  );

  const isDark = themeMode === 'dark' || (themeMode === 'system' && scheme === 'dark');
  const colors = isDark ? darkPalette : lightPalette;
  const isCloudActive = isRealSupabaseConfigured();

  const syncFromSupabase = async (user: SupabaseUser) => {
    try {
      const mRecord = await ensureMerchantRecord(user);
      if (!mRecord) return;

      setMerchantCloudId(mRecord.id);

      setMerchantProfile((prev) => {
        const next: MerchantProfile = {
          ...prev,
          businessName: mRecord.business_name || prev.businessName,
          vpa: mRecord.vpa || prev.vpa,
        };
        storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      if (mRecord.spoken_language) {
        _setSpokenLanguage(mRecord.spoken_language);
        storage.setItem(LANG_STORAGE_KEY, mRecord.spoken_language);
      }

      // Sync cloud payments
      const cloudPayments = await fetchCloudPayments(mRecord.id);
      if (cloudPayments && cloudPayments.length > 0) {
        const mapped: PaymentEvent[] = cloudPayments.map((cp) => ({
          id: cp.id,
          amount: Number(cp.amount),
          source: cp.source || 'UPI',
          time: new Date(cp.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          date: cp.created_at ? cp.created_at.split('T')[0] : undefined,
          timestamp: cp.created_at ? new Date(cp.created_at).getTime() : Date.now(),
          state: cp.state || 'Played',
          note: cp.note,
          payerName: cp.payer_name,
          utr: cp.utr,
          simulated: false,
        }));
        setEvents((currentEvents) => {
          const cloudIds = new Set(mapped.map((c) => c.id));
          const merged = [...mapped, ...currentEvents.filter((e) => !cloudIds.has(e.id))];
          storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }

      // Sync cloud expenses
      const cloudExpenses = await fetchCloudExpenses(mRecord.id);
      if (cloudExpenses && cloudExpenses.length > 0) {
        const mappedExp: Expense[] = cloudExpenses.map((ce) => ({
          id: ce.id,
          title: ce.title,
          amount: Number(ce.amount),
          category: ce.category as ExpenseCategory,
          date: ce.date || 'Cloud Record',
          status: ce.status || 'done',
          paymentMethod: (ce.payment_method as any) || 'UPI',
          note: ce.note,
        }));
        setExpenses((currentExpenses) => {
          const cloudIds = new Set(mappedExp.map((c) => c.id));
          const merged = [...mappedExp, ...currentExpenses.filter((e) => !cloudIds.has(e.id))];
          storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }

      // Sync cloud vault standees
      const cloudVault = await fetchCloudVaultQRs(mRecord.id);
      if (cloudVault && cloudVault.length > 0) {
        const mappedVault: VaultQRCode[] = cloudVault.map((cv) => ({
          id: cv.id,
          appName: (cv.app_name as QRVaultApp) || 'Other',
          title: cv.title,
          imageUri: cv.image_uri,
          vpa: cv.vpa || undefined,
          isPrimary: cv.is_primary,
          createdAt: cv.created_at
            ? new Date(cv.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })
            : 'Synced',
        }));
        setVaultQRs((currentVault) => {
          const cloudIds = new Set(mappedVault.map((c) => c.id));
          const merged = [...mappedVault, ...currentVault.filter((q) => !cloudIds.has(q.id))];
          storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.warn('Error syncing cloud merchant:', e);
    }
  };

  const configureSupabase = async (url: string, anonKey: string) => {
    await saveSupabaseConfig(url, anonKey);
    const updated = getSupabaseConfig();
    setSupabaseConfigState(updated);
    if (currentUser && isRealSupabaseConfigured()) {
      await syncFromSupabase(currentUser);
    }
  };

  const setSpokenLanguage = (lang: string) => {
    _setSpokenLanguage(lang);
    storage.setItem(LANG_STORAGE_KEY, lang);
    if (merchantCloudId) {
      updateMerchantInCloud(merchantCloudId, { spoken_language: lang });
    }
  };

  const setInterfaceLanguage = (lang: string) => {
    _setInterfaceLanguage(lang);
    if (merchantCloudId) {
      updateMerchantInCloud(merchantCloudId, { interface_language: lang });
    }
  };

  const setAnnouncementsEnabled = (enabled: boolean) => {
    _setAnnouncementsEnabled(enabled);
    if (merchantCloudId) {
      updateMerchantInCloud(merchantCloudId, { announcements_enabled: enabled });
    }
  };

  // Load persisted configuration, active Supabase session & local records on mount
  useEffect(() => {
    (async () => {
      try {
        const loadedCfg = await initSupabaseConfig();
        setSupabaseConfigState(loadedCfg);

        // 1. Merchant profile
        const savedProfile = await storage.getItem(PROFILE_STORAGE_KEY);
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (
              parsed.vpa === 'sharma.store@okhdfcbank' ||
              parsed.businessName === 'Sharma Kirana & General Store'
            ) {
              await storage.removeItem(PROFILE_STORAGE_KEY);
            } else {
              setMerchantProfile(parsed);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // 2. Spoken language
        const savedLang = await storage.getItem(LANG_STORAGE_KEY);
        if (savedLang) {
          _setSpokenLanguage(savedLang);
        }

        // 3. Vault QRs
        const savedVault = await storage.getItem(VAULT_STORAGE_KEY);
        if (savedVault) {
          try {
            const parsed = JSON.parse(savedVault);
            if (Array.isArray(parsed)) {
              const cleanVault = parsed.filter(
                (q) => !q.id?.startsWith('vault-') && !q.vpa?.includes('sharma.store')
              );
              if (cleanVault.length !== parsed.length) {
                await storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(cleanVault));
              }
              setVaultQRs(cleanVault);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // 4. Payment events
        const savedEvents = await storage.getItem(EVENTS_STORAGE_KEY);
        if (savedEvents) {
          try {
            const parsed = JSON.parse(savedEvents);
            if (Array.isArray(parsed)) {
              const cleanEvents = parsed.filter(
                (e) => !['pay-1', 'pay-2', 'pay-3', 'pay-4'].includes(e.id)
              );
              if (cleanEvents.length !== parsed.length) {
                await storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(cleanEvents));
              }
              setEvents(cleanEvents);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // 5. Expenses
        const savedExpenses = await storage.getItem(EXPENSES_STORAGE_KEY);
        if (savedExpenses) {
          try {
            const parsed = JSON.parse(savedExpenses);
            if (Array.isArray(parsed)) {
              const cleanExpenses = parsed.filter(
                (e) => !['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5'].includes(e.id)
              );
              if (cleanExpenses.length !== parsed.length) {
                await storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(cleanExpenses));
              }
              setExpenses(cleanExpenses);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // 6. Active session & cloud sync
        const session = await getCurrentSession();
        if (session?.user) {
          setCurrentUser(session.user);
          if (session.user.user_metadata?.business_name || session.user.user_metadata?.vpa) {
            setMerchantProfile((prev) => ({
              ...prev,
              businessName: session.user.user_metadata?.business_name || prev.businessName,
              vpa: session.user.user_metadata?.vpa || prev.vpa,
            }));
          }
          // Sync with Supabase asynchronously without blocking initial UI render
          syncFromSupabase(session.user);
        }
      } catch (err) {
        console.warn('Failed to load persisted settings', err);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const loginUser = (user: SupabaseUser) => {
    setCurrentUser(user);
    if (user.user_metadata?.business_name || user.user_metadata?.vpa) {
      updateMerchantProfile({
        businessName: user.user_metadata.business_name || merchantProfile.businessName,
        vpa: user.user_metadata.vpa || merchantProfile.vpa,
      });
    }
    if (user.user_metadata?.spoken_language) {
      setSpokenLanguage(user.user_metadata.spoken_language);
    }

    syncFromSupabase(user);
  };

  const logoutUser = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out error', e);
    }
    setCurrentUser(null);
    setMerchantCloudId(null);
    setMerchantProfile(defaultMerchantProfile);
    setEvents([]);
    setExpenses([]);
    await storage.removeItem(PROFILE_STORAGE_KEY);
    await storage.removeItem(EVENTS_STORAGE_KEY);
    await storage.removeItem(EXPENSES_STORAGE_KEY);
  };

  const updateMerchantProfile = (updates: Partial<MerchantProfile>) => {
    setMerchantProfile((prev) => {
      const next = { ...prev, ...updates };
      storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      if (merchantCloudId && (updates.businessName !== undefined || updates.vpa !== undefined)) {
        updateMerchantInCloud(merchantCloudId, {
          business_name: next.businessName,
          vpa: next.vpa,
        });
      }
      return next;
    });
  };

  const addVaultQR = (newQR: Omit<VaultQRCode, 'id' | 'createdAt'>) => {
    const item: VaultQRCode = {
      ...newQR,
      id: `vault_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };

    setVaultQRs((prev) => {
      const updated = newQR.isPrimary
        ? [item, ...prev.map((q) => ({ ...q, isPrimary: false }))]
        : [item, ...prev];
      storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (merchantCloudId) {
      upsertVaultQRToCloud(merchantCloudId, item);
    }

    if (newQR.isPrimary && newQR.vpa) {
      updateMerchantProfile({ vpa: newQR.vpa });
    }
  };

  const removeVaultQR = (id: string) => {
    setVaultQRs((prev) => {
      const remaining = prev.filter((q) => q.id !== id);
      if (remaining.length > 0 && !remaining.some((q) => q.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(remaining));
      return remaining;
    });

    if (merchantCloudId) {
      deleteVaultQRFromCloud(merchantCloudId, id);
    }
  };

  const setActiveVaultQR = (id: string) => {
    setVaultQRs((prev) => {
      const updated = prev.map((q) => ({
        ...q,
        isPrimary: q.id === id,
      }));
      const active = updated.find((q) => q.id === id);
      if (active?.vpa) {
        updateMerchantProfile({ vpa: active.vpa });
      }
      if (merchantCloudId && active) {
        upsertVaultQRToCloud(merchantCloudId, active);
      }
      storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const activeVaultQR = useMemo(() => {
    return vaultQRs.find((q) => q.isPrimary) || vaultQRs[0] || null;
  }, [vaultQRs]);

  const speakExpense = async (expense: Expense) => {
    try {
      await Speech.stop();
      const lang = spokenLanguage;
      let text = `Expense of ${expense.amount} rupees for ${expense.title} is ${
        expense.status === 'done' ? 'marked as done' : 'pending'
      }.`;

      if (lang === 'Hindi') {
        text = `${expense.title} के लिए ${expense.amount} रुपये का खर्च ${
          expense.status === 'done' ? 'पूर्ण हुआ' : 'लंबित है'
        }।`;
      } else if (lang === 'Telugu') {
        text = `${expense.title} కోసం ${expense.amount} రూపాయల ఖర్చు ${
          expense.status === 'done' ? 'పూర్తయింది' : 'పెండింగ్‌లో ఉంది'
        }.`;
      } else if (lang === 'Tamil') {
        text = `${expense.title} க்கான ${expense.amount} ரூபாய் செலவு ${
          expense.status === 'done' ? 'முடிந்தது' : 'நிலுவையில் உள்ளது'
        }.`;
      } else if (lang === 'Kannada') {
        text = `${expense.title} ಗಾಗಿ ${expense.amount} ರೂಪಾಯಿ ಖರ್ಚು ${
          expense.status === 'done' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'ಬಾಕಿ ಇದೆ'
        }.`;
      }

      Speech.speak(text, {
        language: languageCodes[lang] ?? 'en-IN',
        rate: 0.9,
      });
    } catch (e) {
      console.warn('Speech playback failed', e);
    }
  };

  const speakPayment = async (amount: number, source: string = 'UPI', payerName?: string) => {
    try {
      await Speech.stop();
      const lang = spokenLanguage;
      const payerPhrase = payerName ? ` from ${payerName}` : '';
      let text = `Received ${amount} rupees on ${source}${payerPhrase}.`;

      if (lang === 'Hindi') {
        const hindiPayer = payerName ? ` ${payerName} से` : '';
        text = `${source} पर${hindiPayer} ${amount} रुपये प्राप्त हुए।`;
      } else if (lang === 'Telugu') {
        text = `${source} లో ${amount} రూపాయలు వచ్చాయి.`;
      } else if (lang === 'Tamil') {
        text = `${source} இல் ${amount} ரூபாய் பெறப்பட்டது.`;
      } else if (lang === 'Kannada') {
        text = `${source} ನಲ್ಲಿ ${amount} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`;
      }

      Speech.speak(text, {
        language: languageCodes[lang] ?? 'en-IN',
        rate: 0.9,
      });
    } catch (e) {
      console.warn('Speech playback failed', e);
    }
  };

  const addExpense = (newExp: Omit<Expense, 'id'>, announce = true) => {
    const tempId = `exp-${Date.now()}`;
    const item: Expense = {
      ...newExp,
      id: tempId,
    };
    setExpenses((old) => {
      const next = [item, ...old];
      storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (merchantCloudId) {
      insertExpenseToCloud({
        merchantId: merchantCloudId,
        title: item.title,
        amount: item.amount,
        category: item.category,
        status: item.status,
        paymentMethod: item.paymentMethod || 'UPI',
        date: item.date,
        note: item.note,
      }).then((cloudRow) => {
        if (cloudRow?.id) {
          setExpenses((old) => {
            const next = old.map((e) => (e.id === tempId ? { ...e, id: cloudRow.id } : e));
            storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
      });
    }

    if (announce && announcementsEnabled) {
      speakExpense(item);
    }
  };

  const removeExpense = (id: string) => {
    setExpenses((old) => {
      const next = old.filter((item) => item.id !== id);
      storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (merchantCloudId) {
      deleteExpenseFromCloud(merchantCloudId, id);
    }
  };

  const toggleExpenseStatus = (id: string, announce = true) => {
    setExpenses((old) => {
      const next = old.map((item) => {
        if (item.id === id) {
          const nextStatus: ExpenseStatus = item.status === 'done' ? 'pending' : 'done';
          const updated: Expense = { ...item, status: nextStatus };
          if (announce && announcementsEnabled) {
            speakExpense(updated);
          }
          if (merchantCloudId) {
            updateExpenseInCloud(merchantCloudId, id, { status: nextStatus });
          }
          return updated;
        }
        return item;
      });
      storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((old) => {
      const next = old.map((item) => (item.id === id ? { ...item, ...updates } : item));
      storage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (merchantCloudId) {
      updateExpenseInCloud(merchantCloudId, id, updates);
    }
  };

  const recordRealPayment = (
    amount: number,
    payerName?: string,
    source = 'UPI Payment',
    utr?: string,
    alreadyAnnouncedNatively = false
  ) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const date = now.toISOString().split('T')[0];
    const timestamp = now.getTime();
    const state: EventState =
      alreadyAnnouncedNatively || announcementsEnabled ? 'Played' : 'Pending';
    const tempId = `pay-${Date.now()}`;

    const newEvent: PaymentEvent = {
      id: tempId,
      amount,
      source,
      time,
      date,
      timestamp,
      state,
      note: utr ? `UTR: ${utr}` : 'Live payment verified',
      payerName,
      utr,
      simulated: false,
    };

    setEvents((old) => {
      const next = [newEvent, ...old];
      storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (merchantCloudId) {
      insertPaymentToCloud({
        merchantId: merchantCloudId,
        amount,
        source,
        payerName,
        utr,
        state,
        rawNotification: `Payment of Rs.${amount} received on ${source}`,
      })
        .then((cloudRow) => {
          if (cloudRow?.id) {
            setEvents((old) => {
              const next = old.map((ev) => (ev.id === tempId ? { ...ev, id: cloudRow.id } : ev));
              storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }
        })
        .catch((e) => {
          console.warn('Could not insert payment to cloud:', e);
        });
    }

    if (announcementsEnabled && !alreadyAnnouncedNatively) {
      speakPayment(amount, source, payerName);
    }
  };

  const addPaymentEvent = (amount: number, source = 'PhonePe Merchant') => {
    recordRealPayment(amount, undefined, source);
  };

  const simulatePayment = (amount: number) => {
    addPaymentEvent(amount, 'UPI Notification');
  };

  const simulateFailure = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setEvents((old) => [
      {
        id: `fail-${Date.now()}`,
        amount: 40,
        source: 'UPI Notification',
        time,
        state: 'Failed',
        note: 'Announcement failed · Audio output issue',
        simulated: false,
      },
      ...old,
    ]);
  };

  const simulateMissingPermission = () => setPermissionState('revoked');
  const simulatePermissionEnabled = () => setPermissionState('enabled');

  const clearEvents = () => {
    setEvents([]);
    storage.removeItem(EVENTS_STORAGE_KEY);
  };

  const clearExpenses = () => {
    setExpenses([]);
    storage.removeItem(EXPENSES_STORAGE_KEY);
  };

  const clearAllData = () => {
    setEvents([]);
    setExpenses([]);
    storage.removeItem(EVENTS_STORAGE_KEY);
    storage.removeItem(EXPENSES_STORAGE_KEY);
  };

  const resetDemo = () => {
    clearAllData();
    setDemoMode(false);
  };

  const exitDemoMode = () => {
    setDemoMode(false);
  };

  const checkNotificationPermission = async (): Promise<boolean> => {
    try {
      const granted = await isPermissionGranted();
      setPermissionState(granted ? 'enabled' : 'not-granted');
      return granted;
    } catch {
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      await openPermissionSettings();
      const granted = await isPermissionGranted();
      setPermissionState(granted ? 'enabled' : 'not-granted');
      return granted;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const recordRealPaymentRef = React.useRef(recordRealPayment);
  recordRealPaymentRef.current = recordRealPayment;

  useEffect(() => {
    const sub = addPaymentListener((payment) => {
      console.log('[DhwaniPay Soundbox] Native notification intercepted:', payment);
      if (recordRealPaymentRef.current && payment.amount > 0) {
        recordRealPaymentRef.current(
          payment.amount,
          payment.payer || undefined,
          payment.source || 'UPI Soundbox',
          payment.utr || undefined,
          Boolean(payment.announcedNatively)
        );
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (merchantProfile.mode !== 'cloud-webhook' || !merchantProfile.gatewayUrl) {
      setGatewayConnected(false);
      return;
    }

    let ws: WebSocket | null = null;
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;

    const connect = () => {
      if (!isMounted) return;

      try {
        let wsUrl = merchantProfile.gatewayUrl.trim();
        const activeId = merchantCloudId || currentUser?.id || 'default_merchant';
        if (wsUrl.includes('?')) {
          wsUrl += `&merchantId=${encodeURIComponent(activeId)}`;
        } else {
          wsUrl += `?merchantId=${encodeURIComponent(activeId)}`;
        }

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          retryAttempt = 0;
          setGatewayConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PAYMENT_RECEIVED' && data.amount) {
              if (
                data.merchantId &&
                data.merchantId !== activeId &&
                activeId !== 'default_merchant'
              ) {
                return;
              }

              if (recordRealPaymentRef.current) {
                recordRealPaymentRef.current(
                  Number(data.amount),
                  data.payerName,
                  data.source || 'Payment Gateway',
                  data.utr,
                  false
                );
              }
            }
          } catch (err) {
            console.warn('Failed to parse gateway payment packet:', err);
          }
        };

        ws.onerror = () => {
          if (isMounted) setGatewayConnected(false);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setGatewayConnected(false);
          const delay = Math.min(1500 * Math.pow(1.5, retryAttempt++), 30000);
          reconnectTimeout = setTimeout(connect, delay);
        };
      } catch {
        if (isMounted) {
          setGatewayConnected(false);
          const delay = Math.min(1500 * Math.pow(1.5, retryAttempt++), 30000);
          reconnectTimeout = setTimeout(connect, delay);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [merchantProfile.mode, merchantProfile.gatewayUrl, merchantCloudId, currentUser?.id]);

  const value = useMemo(
    () => ({
      events,
      expenses,
      demoMode,
      announcementsEnabled,
      permissionState,
      spokenLanguage,
      interfaceLanguage,
      themeMode,
      colors,
      isDark,
      merchantProfile,
      gatewayConnected,
      currentUser,
      authLoading,
      merchantCloudId,
      isCloudActive,
      supabaseUrl: supabaseConfigState.url,
      supabaseAnonKey: supabaseConfigState.anonKey,
      configureSupabase,
      vaultQRs,
      activeVaultQR,
      addVaultQR,
      removeVaultQR,
      setActiveVaultQR,
      loginUser,
      logoutUser,
      updateMerchantProfile,
      setDemoMode,
      setAnnouncementsEnabled,
      setPermissionState,
      checkNotificationPermission,
      requestNotificationPermission,
      setSpokenLanguage,
      setInterfaceLanguage,
      setThemeMode,
      addExpense,
      removeExpense,
      toggleExpenseStatus,
      updateExpense,
      speakExpense,
      addPaymentEvent,
      recordRealPayment,
      speakPayment,
      simulatePayment,
      simulateFailure,
      simulateMissingPermission,
      simulatePermissionEnabled,
      resetDemo,
      exitDemoMode,
      clearEvents,
      clearExpenses,
      clearAllData,
    }),
    [
      events,
      expenses,
      vaultQRs,
      activeVaultQR,
      demoMode,
      announcementsEnabled,
      permissionState,
      spokenLanguage,
      interfaceLanguage,
      themeMode,
      colors,
      isDark,
      merchantProfile,
      gatewayConnected,
      currentUser,
      authLoading,
      merchantCloudId,
      isCloudActive,
      supabaseConfigState,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
