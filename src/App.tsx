import React, { useState } from 'react';
import {
  Home,
  Receipt,
  History,
  Settings2,
  Volume2,
  QrCode,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useApp } from './context/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { HomeTab } from './components/tabs/HomeTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { ActivityTab } from './components/tabs/ActivityTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { AudioVisualizer } from './components/AudioVisualizer';
import { CollectModal } from './components/modals/CollectModal';
import { DemoModal } from './components/modals/DemoModal';
import { VoiceTestModal } from './components/modals/VoiceTestModal';
import { QRVaultModal } from './components/modals/QRVaultModal';
import { MerchantProfileModal } from './components/modals/MerchantProfileModal';
import { HealthModal } from './components/modals/HealthModal';

export default function App() {
  const {
    currentUser,
    merchantProfile,
    announcementsEnabled,
    logoutUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'home' | 'expenses' | 'activity' | 'settings'>('home');

  // Modals state
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isVoiceTestOpen, setIsVoiceTestOpen] = useState(false);
  const [isQRVaultOpen, setIsQRVaultOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);

  // 1. Unauthenticated Gate
  if (!currentUser) {
    return <AuthScreen />;
  }

  // 2. First-time Onboarding Gate
  if (!merchantProfile.isOnboarded) {
    return <OnboardingWizard />;
  }

  // 3. Authenticated Soundbox Dashboard
  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#17231D] flex flex-col items-center">
      {/* Top Terminal Header */}
      <header className="w-full max-w-2xl bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-[#DDF7EA] text-[#087F5B] flex items-center justify-center font-black shadow-inner">
            <Volume2 className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 bg-[#087F5B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
              ₹
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
                DhwaniPay
              </h1>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  announcementsEnabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {announcementsEnabled ? 'ONLINE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
              {merchantProfile.businessName || currentUser.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#07533F] text-white font-extrabold text-xs shadow-sm transition active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collect UPI</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl flex-1 px-4 py-5 pb-24">
        {activeTab === 'home' && (
          <HomeTab
            onOpenCollect={() => setIsCollectOpen(true)}
            onOpenDemo={() => setIsDemoOpen(true)}
            onOpenVoiceTest={() => setIsVoiceTestOpen(true)}
            onOpenQRVault={() => setIsQRVaultOpen(true)}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenAddExpense={() => setActiveTab('expenses')}
          />
        )}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'activity' && <ActivityTab />}
        {activeTab === 'settings' && (
          <SettingsTab
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenVoiceTest={() => setIsVoiceTestOpen(true)}
            onOpenQRVault={() => setIsQRVaultOpen(true)}
            onOpenHealth={() => setIsHealthOpen(true)}
            onOpenDemo={() => setIsDemoOpen(true)}
          />
        )}
      </main>

      {/* Audio Waveform Live Visualizer */}
      <AudioVisualizer />

      {/* Modals */}
      <CollectModal isOpen={isCollectOpen} onClose={() => setIsCollectOpen(false)} />
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
      <VoiceTestModal isOpen={isVoiceTestOpen} onClose={() => setIsVoiceTestOpen(false)} />
      <QRVaultModal isOpen={isQRVaultOpen} onClose={() => setIsQRVaultOpen(false)} />
      <MerchantProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <HealthModal isOpen={isHealthOpen} onClose={() => setIsHealthOpen(false)} />

      {/* Bottom Sticky Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg flex justify-center">
        <div className="w-full max-w-2xl px-2 py-1.5 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition ${
              activeTab === 'home'
                ? 'text-[#087F5B] font-black'
                : 'text-slate-400 hover:text-slate-700 font-bold'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[11px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition ${
              activeTab === 'expenses'
                ? 'text-[#087F5B] font-black'
                : 'text-slate-400 hover:text-slate-700 font-bold'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'expenses' ? 2.5 : 2} />
            <span className="text-[11px]">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition ${
              activeTab === 'activity'
                ? 'text-[#087F5B] font-black'
                : 'text-slate-400 hover:text-slate-700 font-bold'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'activity' ? 2.5 : 2} />
            <span className="text-[11px]">Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition ${
              activeTab === 'settings'
                ? 'text-[#087F5B] font-black'
                : 'text-slate-400 hover:text-slate-700 font-bold'
            }`}
          >
            <Settings2 className="w-5 h-5 mb-0.5" strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[11px]">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
