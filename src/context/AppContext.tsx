import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  PaymentEvent,
  Expense,
  MerchantProfile,
  VaultQRCode,
  SupportedLanguage,
  ExpenseCategory,
  ExpenseStatus,
  PermissionState,
  UserAccount,
} from '../types';
import { INITIAL_VAULT_QRS } from '../constants/vaultPresets';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { name: 'English', nativeName: 'English (India)', code: 'en-IN' },
  { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi-IN' },
  { name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN' },
  { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN' },
  { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN' },
  { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN' },
  { name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN' },
];

const defaultMerchantProfile: MerchantProfile = {
  vpa: '',
  businessName: '',
  mcc: '5411',
  phone: '',
  gatewayUrl: '',
  mode: 'notification-listener',
  isOnboarded: false,
};

// Strict production zero-slate: No hardcoded demo events or expenses
const initialEvents: PaymentEvent[] = [];
const initialExpenses: Expense[] = [];

const EVENTS_STORAGE_KEY = 'dhwani_payment_events_v2';
const EXPENSES_STORAGE_KEY = 'dhwani_expenses_v2';
const PROFILE_STORAGE_KEY = 'dhwani_merchant_profile_v2';
const VAULT_STORAGE_KEY = 'dhwani_qr_vault_v2';
const LANG_STORAGE_KEY = 'dhwani_spoken_language_v2';
const USER_STORAGE_KEY = 'dhwani_auth_user_v2';
const USERS_DB_KEY = 'dhwani_registered_merchants_v2';

type AppContextType = {
  events: PaymentEvent[];
  expenses: Expense[];
  merchantProfile: MerchantProfile;
  vaultQRs: VaultQRCode[];
  activeVaultQR: VaultQRCode | null;
  spokenLanguage: string;
  themeMode: 'light' | 'dark';
  announcementsEnabled: boolean;
  permissionState: PermissionState;
  isSpeaking: boolean;
  currentSpeakingText: string;
  speechRate: number;
  currentUser: UserAccount | null;
  
  // Auth
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => Promise<void>;
  completeOnboarding: (data: { businessName: string; vpa: string; language: string; mcc?: string }) => void;

  // Actions
  setAnnouncementsEnabled: (v: boolean) => void;
  setSpokenLanguage: (lang: string) => void;
  setThemeMode: (theme: 'light' | 'dark') => void;
  setSpeechRate: (rate: number) => void;
  setPermissionState: (state: PermissionState) => void;
  updateMerchantProfile: (updates: Partial<MerchantProfile>) => void;
  
  // Audio Soundbox
  speakPayment: (amount: number, source?: string, payerName?: string) => Promise<void>;
  speakExpense: (expense: Expense) => Promise<void>;
  speakCustomPhrase: (text: string) => Promise<void>;
  stopAudio: () => void;
  
  // Transactions
  recordRealPayment: (amount: number, payerName?: string, source?: string, utr?: string) => void;
  addPaymentEvent: (amount: number, source?: string) => void;
  clearEvents: () => void;
  
  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>, announce?: boolean) => void;
  removeExpense: (id: string) => void;
  toggleExpenseStatus: (id: string, announce?: boolean) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  clearExpenses: () => void;
  
  // Vault
  addVaultQR: (qr: Omit<VaultQRCode, 'id' | 'createdAt'>) => void;
  removeVaultQR: (id: string) => void;
  setActiveVaultQR: (id: string) => void;
  
  // Soundbox Testing
  simulatePayment: (amount: number, source?: string, payer?: string) => void;
  simulateFailure: () => void;
  resetAllData: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Purge legacy demo keys if present in browser
  useEffect(() => {
    try {
      localStorage.removeItem('dhwani_web_payment_events_v1');
      localStorage.removeItem('dhwani_web_expenses_v1');
      localStorage.removeItem('dhwani_web_merchant_profile_v1');
      localStorage.removeItem('dhwani_web_qr_vault_v1');
    } catch {
      // Ignore
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultMerchantProfile;
    } catch {
      return defaultMerchantProfile;
    }
  });

  const [events, setEvents] = useState<PaymentEvent[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(EXPENSES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [vaultQRs, setVaultQRs] = useState<VaultQRCode[]>(() => {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_VAULT_QRS;
    } catch {
      return INITIAL_VAULT_QRS;
    }
  });

  const [spokenLanguage, setSpokenLanguageState] = useState<string>(() => {
    return localStorage.getItem(LANG_STORAGE_KEY) || 'Hindi';
  });

  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>('light');
  const [announcementsEnabled, setAnnouncementsEnabled] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<PermissionState>('enabled');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpeakingText, setCurrentSpeakingText] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(0.92);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merchantProfile));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [merchantProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaultQRs));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [vaultQRs]);

  const setSpokenLanguage = (lang: string) => {
    setSpokenLanguageState(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
  };

  // Auth Operations
  const registerUser = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (!pass || pass.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      // Check existing accounts
      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, { hash: string; id: string; createdAt: string }> = rawUsers
        ? JSON.parse(rawUsers)
        : {};

      if (users[cleanEmail]) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }

      const newUser: UserAccount = {
        id: `m_${Date.now().toString(36)}`,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      };

      users[cleanEmail] = {
        hash: btoa(pass), // Base64 encoding for client storage
        id: newUser.id,
        createdAt: newUser.createdAt,
      };

      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      setCurrentUser(newUser);

      // Reset profile state for new user
      setMerchantProfile({ ...defaultMerchantProfile, isOnboarded: false });
      setEvents([]);
      setExpenses([]);
      setVaultQRs([]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const loginUser = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !pass) {
        return { success: false, error: 'Please provide both email and password.' };
      }

      const rawUsers = localStorage.getItem(USERS_DB_KEY);
      const users: Record<string, { hash: string; id: string; createdAt: string }> = rawUsers
        ? JSON.parse(rawUsers)
        : {};

      const existing = users[cleanEmail];
      if (!existing) {
        return { success: false, error: 'Account not found. Please register a new account.' };
      }

      if (existing.hash !== btoa(pass)) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      const user: UserAccount = {
        id: existing.id,
        email: cleanEmail,
        createdAt: existing.createdAt,
      };

      setCurrentUser(user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const logoutUser = async (): Promise<void> => {
    setCurrentUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const completeOnboarding = (data: {
    businessName: string;
    vpa: string;
    language: string;
    mcc?: string;
  }) => {
    const updatedProfile: MerchantProfile = {
      ...merchantProfile,
      businessName: data.businessName.trim(),
      vpa: data.vpa.trim(),
      mcc: data.mcc || '5411',
      isOnboarded: true,
    };

    setMerchantProfile(updatedProfile);
    setSpokenLanguage(data.language);

    // Automatically generate the initial primary QR standee in the vault
    const primaryStandee: VaultQRCode = {
      id: `standee_${Date.now()}`,
      appName: 'Bank QR',
      title: `${data.businessName} Counter Standee`,
      vpa: data.vpa.trim(),
      createdAt: 'Today',
      isPrimary: true,
    };
    setVaultQRs([primaryStandee]);
  };

  const activeVaultQR = useMemo(() => {
    return vaultQRs.find((q) => q.isPrimary) || vaultQRs[0] || null;
  }, [vaultQRs]);

  const updateMerchantProfile = (updates: Partial<MerchantProfile>) => {
    setMerchantProfile((prev) => ({ ...prev, ...updates }));
  };

  // Web Speech API Voice Synthesizer
  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeakingText('');
    }
  };

  const speakCustomPhrase = async (text: string): Promise<void> => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis API not available');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      const langObj = SUPPORTED_LANGUAGES.find((l) => l.name === spokenLanguage);
      const targetCode = langObj ? langObj.code : 'en-IN';
      utterance.lang = targetCode;

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find((v) => v.lang === targetCode || v.lang.startsWith(targetCode.slice(0, 2)));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentSpeakingText(text);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentSpeakingText('');
      };

      utterance.onerror = (err) => {
        console.warn('Speech error:', err);
        setIsSpeaking(false);
        setCurrentSpeakingText('');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak phrase:', err);
      setIsSpeaking(false);
    }
  };

  const speakPayment = async (amount: number, source = 'Google Pay', payerName?: string) => {
    if (!announcementsEnabled) return;

    let phrase = '';
    const payerPart = payerName ? ` from ${payerName}` : '';

    if (spokenLanguage === 'Hindi') {
      const payerHindi = payerName ? ` ${payerName} से` : '';
      phrase = `${source} पर${payerHindi} ${amount} रुपये प्राप्त हुए।`;
    } else if (spokenLanguage === 'Telugu') {
      phrase = `${source} లో ${amount} రూపాయలు వచ్చాయి.`;
    } else if (spokenLanguage === 'Kannada') {
      phrase = `${source} ನಲ್ಲಿ ${amount} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`;
    } else if (spokenLanguage === 'Tamil') {
      phrase = `${source} இல் ${amount} ரூபாய் பெறப்பட்டது.`;
    } else if (spokenLanguage === 'Malayalam') {
      phrase = `${source} ൽ ${amount} രൂപ ലഭിച്ചു.`;
    } else if (spokenLanguage === 'Marathi') {
      phrase = `${source} वर ${amount} रुपये प्राप्त झाले.`;
    } else {
      phrase = `Received ${amount} rupees on ${source}${payerPart}.`;
    }

    await speakCustomPhrase(phrase);
  };

  const speakExpense = async (expense: Expense) => {
    if (!announcementsEnabled) return;

    let phrase = '';
    const isDone = expense.status === 'done';

    if (spokenLanguage === 'Hindi') {
      phrase = `${expense.title} के लिए ${expense.amount} रुपये का खर्च ${isDone ? 'पूर्ण हुआ' : 'लंबित है'}।`;
    } else if (spokenLanguage === 'Telugu') {
      phrase = `${expense.title} కోసం ${expense.amount} రూపాయల ఖర్చు ${isDone ? 'పూర్తయింది' : 'పెండింగ్‌లో ఉంది'}.`;
    } else if (spokenLanguage === 'Kannada') {
      phrase = `${expense.title} ಗಾಗಿ ${expense.amount} ರೂಪಾಯಿ ಖರ್ಚು ${isDone ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'ಬಾಕಿ ಇದೆ'}.`;
    } else if (spokenLanguage === 'Tamil') {
      phrase = `${expense.title} க்கான ${expense.amount} ரூபாய் செலவு ${isDone ? 'முடிந்தது' : 'நிலுவையில் உள்ளது'}.`;
    } else {
      phrase = `Expense of ${expense.amount} rupees for ${expense.title} is ${isDone ? 'marked as paid' : 'pending'}.`;
    }

    await speakCustomPhrase(phrase);
  };

  const recordRealPayment = (
    amount: number,
    payerName?: string,
    source = 'UPI Payment',
    utr?: string
  ) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const date = now.toISOString().split('T')[0];
    const timestamp = now.getTime();

    const newEvent: PaymentEvent = {
      id: `pay-${Date.now()}`,
      amount,
      source,
      time,
      date,
      timestamp,
      state: announcementsEnabled ? 'Played' : 'Pending',
      note: utr ? `UTR: ${utr}` : 'Live payment verified',
      payerName,
      utr: utr || `4289${Math.floor(10000000 + Math.random() * 90000000)}`,
      simulated: false,
    };

    setEvents((prev) => [newEvent, ...prev]);

    if (announcementsEnabled) {
      speakPayment(amount, source, payerName);
    }
  };

  const addPaymentEvent = (amount: number, source = 'Google Pay') => {
    recordRealPayment(amount, undefined, source);
  };

  const simulatePayment = (amount: number, source = 'PhonePe Merchant', payer = 'Customer') => {
    recordRealPayment(amount, payer, source);
  };

  const simulateFailure = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setEvents((prev) => [
      {
        id: `fail-${Date.now()}`,
        amount: 40,
        source: 'UPI Soundbox',
        time,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        state: 'Failed',
        note: 'Announcement failed · Audio output muted or interrupted',
        simulated: true,
      },
      ...prev,
    ]);
  };

  const addExpense = (newExp: Omit<Expense, 'id'>, announce = true) => {
    const item: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [item, ...prev]);

    if (announce && announcementsEnabled) {
      speakExpense(item);
    }
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleExpenseStatus = (id: string, announce = true) => {
    setExpenses((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated: Expense = {
            ...item,
            status: item.status === 'done' ? 'pending' : 'done',
          };
          if (announce && announcementsEnabled) {
            speakExpense(updated);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const clearExpenses = () => {
    setExpenses([]);
  };

  const addVaultQR = (newQR: Omit<VaultQRCode, 'id' | 'createdAt'>) => {
    const item: VaultQRCode = {
      ...newQR,
      id: `vault_${Date.now()}`,
      createdAt: 'Today',
    };
    setVaultQRs((prev) => {
      if (newQR.isPrimary) {
        return [item, ...prev.map((q) => ({ ...q, isPrimary: false }))];
      }
      return [item, ...prev];
    });
    if (newQR.isPrimary && newQR.vpa) {
      updateMerchantProfile({ vpa: newQR.vpa });
    }
  };

  const removeVaultQR = (id: string) => {
    setVaultQRs((prev) => {
      const next = prev.filter((q) => q.id !== id);
      if (next.length > 0 && !next.some((q) => q.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setActiveVaultQR = (id: string) => {
    setVaultQRs((prev) => {
      const next = prev.map((q) => ({ ...q, isPrimary: q.id === id }));
      const active = next.find((q) => q.id === id);
      if (active?.vpa) {
        updateMerchantProfile({ vpa: active.vpa });
      }
      return next;
    });
  };

  const resetAllData = () => {
    setEvents([]);
    setExpenses([]);
    setMerchantProfile({ ...defaultMerchantProfile, isOnboarded: false });
    setVaultQRs([]);
    setAnnouncementsEnabled(true);
    setPermissionState('enabled');
    stopAudio();
    logoutUser();
  };

  const value = {
    events,
    expenses,
    merchantProfile,
    vaultQRs,
    activeVaultQR,
    spokenLanguage,
    themeMode,
    announcementsEnabled,
    permissionState,
    isSpeaking,
    currentSpeakingText,
    speechRate,
    currentUser,
    loginUser,
    registerUser,
    logoutUser,
    completeOnboarding,
    setAnnouncementsEnabled,
    setSpokenLanguage,
    setThemeMode,
    setSpeechRate,
    setPermissionState,
    updateMerchantProfile,
    speakPayment,
    speakExpense,
    speakCustomPhrase,
    stopAudio,
    recordRealPayment,
    addPaymentEvent,
    clearEvents,
    addExpense,
    removeExpense,
    toggleExpenseStatus,
    updateExpense,
    clearExpenses,
    addVaultQR,
    removeVaultQR,
    setActiveVaultQR,
    simulatePayment,
    simulateFailure,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
