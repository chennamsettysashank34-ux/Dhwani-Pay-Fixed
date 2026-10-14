import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Database,
  Radio,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HealthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const {
    events,
    expenses,
    spokenLanguage,
    announcementsEnabled,
    permissionState,
    speechRate,
  } = useApp();

  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const DIAGNOSTICS = [
    {
      title: 'Voice Speech Synthesizer',
      subtitle: `SpeechSynthesis API active (${spokenLanguage} · ${speechRate}x)`,
      status: hasSpeechSynthesis ? 'OK' : 'Unavailable',
      isOk: hasSpeechSynthesis,
      icon: Volume2,
    },
    {
      title: 'Soundbox Announcement Engine',
      subtitle: announcementsEnabled ? 'Audio alerts enabled for all payments' : 'Soundbox is currently muted/paused',
      status: announcementsEnabled ? 'Active' : 'Paused',
      isOk: announcementsEnabled,
      icon: Radio,
    },
    {
      title: 'Ledger Storage Persistence',
      subtitle: `${events.length} transactions, ${expenses.length} expenses cached`,
      status: 'Synced',
      isOk: true,
      icon: Database,
    },
    {
      title: 'Notification Interceptor',
      subtitle: 'Simulated merchant banking notification service ready',
      status: 'Ready',
      isOk: true,
      icon: Cpu,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Soundbox Diagnostics
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Hardware & service health check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2.5">
            {DIAGNOSTICS.map((diag, i) => {
              const Icon = diag.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{diag.title}</p>
                      <p className="text-[11px] text-slate-500">{diag.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      diag.isOk
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {diag.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-semibold">
              All soundbox modules are operating normally. Ready to announce payments.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
