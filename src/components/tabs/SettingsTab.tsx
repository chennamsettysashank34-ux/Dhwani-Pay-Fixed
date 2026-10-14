import React from 'react';
import {
  Store,
  Languages,
  Headphones,
  Sparkles,
  ShieldCheck,
  FolderLock,
  Moon,
  Sun,
  RotateCcw,
  Trash2,
  ChevronRight,
  Sliders,
  Volume2,
  Info,
  LogOut,
} from 'lucide-react';
import { useApp, SUPPORTED_LANGUAGES } from '../../context/AppContext';

interface SettingsTabProps {
  onOpenProfile: () => void;
  onOpenVoiceTest: () => void;
  onOpenQRVault: () => void;
  onOpenHealth: () => void;
  onOpenDemo: () => void;
}

export function SettingsTab({
  onOpenProfile,
  onOpenVoiceTest,
  onOpenQRVault,
  onOpenHealth,
  onOpenDemo,
}: SettingsTabProps) {
  const {
    merchantProfile,
    spokenLanguage,
    setSpokenLanguage,
    speechRate,
    setSpeechRate,
    themeMode,
    setThemeMode,
    resetAllData,
    clearEvents,
    clearExpenses,
    currentUser,
    logoutUser,
  } = useApp();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Soundbox Settings
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Configure regional voice, store profile, and soundbox preferences
        </p>
      </div>

      {/* Merchant Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {merchantProfile.businessName}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                UPI ID: {merchantProfile.vpa}
              </p>
              {currentUser && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Signed in as {currentUser.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                if (confirm('Sign out of your merchant soundbox account?')) {
                  logoutUser();
                }
              }}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice & Language Settings */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Voice Announcements
        </h3>

        {/* Language Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Spoken Soundbox Language
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.name === spokenLanguage;
              return (
                <button
                  key={lang.name}
                  onClick={() => setSpokenLanguage(lang.name)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-black shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{lang.name}</span>
                  <span className="text-[11px] opacity-75">{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Speed Slider */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700">
              Speech Rate / Tempo
            </label>
            <span className="text-xs font-bold text-emerald-700">{speechRate}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>

        {/* Voice Test Shortcut */}
        <button
          onClick={onOpenVoiceTest}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition text-slate-800"
        >
          <div className="flex items-center gap-3">
            <Headphones className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold">Open Audio & Speaker Test</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Tools & Modules */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Diagnostics & Standees
        </h3>

        <button
          onClick={onOpenQRVault}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition text-slate-800"
        >
          <div className="flex items-center gap-3">
            <FolderLock className="w-4 h-4 text-purple-600" />
            <div className="text-left">
              <span className="text-xs font-bold block">QR Standee Vault</span>
              <span className="text-[11px] text-slate-500">Manage counter standees</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenHealth}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition text-slate-800"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="text-xs font-bold block">Hardware & Diagnostics</span>
              <span className="text-[11px] text-slate-500">Synthesizer & audio engine health</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenDemo}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition text-slate-800"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <div className="text-left">
              <span className="text-xs font-bold block">Demo Lab & Payment Tester</span>
              <span className="text-[11px] text-slate-500">Simulate incoming UPI notifications</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Data Management & Danger Zone */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Data Management
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              if (confirm('Clear all local expenses ledger records?')) {
                clearExpenses();
              }
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-slate-700 transition"
          >
            <span className="text-xs font-bold block">Clear Expenses</span>
            <span className="text-[10px] text-slate-400">Empty shop ledger</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all recorded payment notifications?')) {
                clearEvents();
              }
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-slate-700 transition"
          >
            <span className="text-xs font-bold block">Clear Payments</span>
            <span className="text-[10px] text-slate-400">Empty history log</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset DhwaniPay back to initial default demo data?')) {
              resetAllData();
            }
          }}
          className="w-full p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Demo Data</span>
        </button>
      </div>

      {/* About Box */}
      <div className="text-center text-xs text-slate-400 space-y-1 pt-2">
        <p className="font-bold text-slate-600">
          DhwaniPay v1.0.0 — Your Phone. Your Payment Soundbox.
        </p>
        <p>
          NPCI ISO/IEC 18004 Standard • Zero Cloud Dependency • Multi-Language Speech Synthesis
        </p>
      </div>
    </div>
  );
}
