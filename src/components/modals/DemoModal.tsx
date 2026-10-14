import React, { useState } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Volume2,
  AlertTriangle,
  BellRing,
  Sparkles,
  CheckCircle2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEST_SCENARIOS = [
  {
    amount: 50,
    source: 'Google Pay for Business',
    payer: 'Sunita Verma',
    description: 'Standard retail tea & grocery payment',
    iconColor: 'bg-blue-50 text-blue-600',
  },
  {
    amount: 120,
    source: 'PhonePe Merchant',
    payer: 'Rahul Sharma',
    description: 'Medium transaction with regional announce',
    iconColor: 'bg-purple-50 text-purple-600',
  },
  {
    amount: 750,
    source: 'Paytm for Business',
    payer: 'Amit Kumar',
    description: 'Higher value bill settlement with UTR id',
    iconColor: 'bg-sky-50 text-sky-700',
  },
  {
    amount: 2500,
    source: 'BHIM UPI',
    payer: 'Kavita Reddy',
    description: 'Wholesale order settlement',
    iconColor: 'bg-orange-50 text-orange-600',
  },
];

export function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const {
    simulatePayment,
    simulateFailure,
    spokenLanguage,
    setSpokenLanguage,
    resetAllData,
    events,
  } = useApp();

  const [customAmount, setCustomAmount] = useState('');
  const [customSource, setCustomSource] = useState('Google Pay');
  const [customPayer, setCustomPayer] = useState('');

  const handleCustomTrigger = () => {
    const amt = parseFloat(customAmount) || 100;
    simulatePayment(amt, customSource, customPayer || 'Customer');
    setCustomAmount('');
    setCustomPayer('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Demo Lab & Payment Tester
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Simulate live UPI notifications & test audio output
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

        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">
                Current Soundbox Voice: <span className="text-emerald-700">{spokenLanguage}</span>
              </p>
              <p>
                Click any scenario below. The app will simulate the merchant incoming payment notification, log it in the ledger, and speak the announcement aloud in real-time.
              </p>
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1-Click Simulated Notifications
            </h3>
            <div className="space-y-2.5">
              {TEST_SCENARIOS.map((sc, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${sc.iconColor}`}>
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{sc.amount}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          on {sc.source}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Payer: {sc.payer} · {sc.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => simulatePayment(sc.amount, sc.source, sc.payer)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Simulation */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Custom Amount Simulator
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <select
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Google Pay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="BHIM UPI">BHIM UPI</option>
                <option value="CRED">CRED</option>
                <option value="Amazon Pay">Amazon Pay</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Customer Name (optional)"
                value={customPayer}
                onChange={(e) => setCustomPayer(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                onClick={handleCustomTrigger}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trigger</span>
              </button>
            </div>
          </div>

          {/* Test Failures & Recovery */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Edge Cases & Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={simulateFailure}
                className="p-3 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-xl text-left text-red-800 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                  <VolumeX className="w-4 h-4 text-red-600" />
                  <span>Simulate Audio Failure</span>
                </div>
                <p className="text-[11px] text-red-600">Tests soundbox retry banner</p>
              </button>

              <button
                onClick={resetAllData}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-slate-700 transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Reset Demo Data</span>
                </div>
                <p className="text-[11px] text-slate-500">Restore fresh state</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
