import React from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  QrCode,
  Sparkles,
  Headphones,
  FolderLock,
  ArrowRight,
  TrendingUp,
  Receipt,
  Store,
  Clock,
  ShieldAlert,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentEvent } from '../../types';

interface HomeTabProps {
  onOpenCollect: () => void;
  onOpenDemo: () => void;
  onOpenVoiceTest: () => void;
  onOpenQRVault: () => void;
  onOpenSettings: () => void;
  onOpenAddExpense: () => void;
}

export function HomeTab({
  onOpenCollect,
  onOpenDemo,
  onOpenVoiceTest,
  onOpenQRVault,
  onOpenSettings,
  onOpenAddExpense,
}: HomeTabProps) {
  const {
    events,
    expenses,
    merchantProfile,
    announcementsEnabled,
    setAnnouncementsEnabled,
    spokenLanguage,
    speakPayment,
    activeVaultQR,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter((e) => !e.date || e.date === todayStr);
  const totalReceived = todayEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCount = todayEvents.length;

  const todayExpenses = expenses.filter((e) => e.date === 'Today' || e.date === todayStr);
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalReceived - totalExpenses;

  const failedEvents = events.filter((e) => e.state === 'Failed');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Soundbox Hero Card */}
      <div
        className={`rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden ${
          announcementsEnabled
            ? 'bg-gradient-to-br from-[#07533F] via-[#087F5B] to-[#0A996E] text-white border-emerald-600 shadow-xl shadow-emerald-900/10'
            : 'bg-slate-800 text-slate-100 border-slate-700 shadow-lg'
        }`}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition ${
                announcementsEnabled
                  ? 'bg-white/15 text-white backdrop-blur-sm'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {announcementsEnabled ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <VolumeX className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    announcementsEnabled
                      ? 'bg-emerald-300 text-emerald-950'
                      : 'bg-slate-600 text-slate-300'
                  }`}
                >
                  {announcementsEnabled ? 'Soundbox Active' : 'Soundbox Paused'}
                </span>
                <span className="text-xs text-white/80 font-medium">
                  • {spokenLanguage}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-1">
                {announcementsEnabled
                  ? 'Ready for incoming payments'
                  : 'Audio announcements paused'}
              </h2>
              <p className="text-xs text-white/75 mt-0.5">
                {activeVaultQR?.title || merchantProfile.businessName} (
                {activeVaultQR?.vpa || merchantProfile.vpa})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setAnnouncementsEnabled(!announcementsEnabled)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-sm ${
                announcementsEnabled
                  ? 'bg-white text-emerald-900 hover:bg-emerald-50'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {announcementsEnabled ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Voice</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Voice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Decorative Rupee symbol in background */}
        <div className="absolute -right-4 -bottom-10 opacity-10 font-black text-9xl select-none pointer-events-none">
          ₹
        </div>
      </div>

      {/* Edge Case Warning if announcement failed */}
      {failedEvents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Audio announcement interrupted</p>
              <p className="text-[11px] text-red-700">
                1 or more recent notifications could not be played aloud.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const lastFailed = failedEvents[0];
              if (lastFailed.amount) {
                speakPayment(lastFailed.amount, lastFailed.source);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Voice</span>
          </button>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Today's UPI Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{totalReceived.toLocaleString('en-IN')}
          </p>
          <p className="text-xs font-semibold text-emerald-700">
            {totalCount} transaction{totalCount !== 1 ? 's' : ''} logged
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Shop Expenses</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </p>
          <p className="text-xs font-semibold text-rose-600">
            {todayExpenses.length} expense record{todayExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Net Store Balance</span>
            <Store className="w-4 h-4 text-slate-400" />
          </div>
          <p
            className={`text-2xl font-black tracking-tight ${
              netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            ₹{netBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Daily shop net profit/cash
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Quick Merchant Tools
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenCollect}
            className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition group shadow-sm flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">Collect UPI</p>
              <p className="text-[11px] text-slate-500 font-medium">Dynamic QR Bill</p>
            </div>
          </button>

          <button
            onClick={onOpenVoiceTest}
            className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition group shadow-sm flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">Voice Test</p>
              <p className="text-[11px] text-slate-500 font-medium">Speaker Clarity</p>
            </div>
          </button>

          <button
            onClick={onOpenDemo}
            className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition group shadow-sm flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">Demo Lab</p>
              <p className="text-[11px] text-slate-500 font-medium">Test Payments</p>
            </div>
          </button>

          <button
            onClick={onOpenQRVault}
            className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition group shadow-sm flex flex-col justify-between h-28"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">QR Standees</p>
              <p className="text-[11px] text-slate-500 font-medium">Counter Vault</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent Payment Stream
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {events.length} total events
          </span>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No payment events logged yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Simulate a test transaction in the Demo Lab or collect payment with your dynamic QR.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={onOpenCollect}
                className="px-4 py-2 bg-[#087F5B] text-white rounded-xl text-xs font-extrabold hover:bg-[#07533F] transition shadow-sm"
              >
                Collect First Payment
              </button>
              <button
                onClick={onOpenDemo}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                Test Voice Alert
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {events.slice(0, 5).map((event) => {
              return (
                <div
                  key={event.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 font-black flex items-center justify-center text-sm shrink-0 border border-emerald-100">
                      ₹
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900 tracking-tight">
                          ₹{event.amount?.toLocaleString('en-IN') || 0}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          on {event.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{event.time}</span>
                        {event.payerName && <span>• {event.payerName}</span>}
                        {event.utr && <span>• UTR {event.utr.slice(-6)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {event.amount && (
                      <button
                        onClick={() =>
                          speakPayment(event.amount!, event.source, event.payerName)
                        }
                        className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                        title="Replay Voice Announcement"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        event.state === 'Played'
                          ? 'bg-emerald-100 text-emerald-800'
                          : event.state === 'Failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {event.state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
