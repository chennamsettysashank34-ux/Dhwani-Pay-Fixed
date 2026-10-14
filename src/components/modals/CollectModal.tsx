import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Volume2,
  Sparkles,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UPIQRCode } from '../UPIQRCode';
import { buildUpiUri, formatInr } from '../../utils/upi';

interface CollectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500];

export function CollectModal({ isOpen, onClose }: CollectModalProps) {
  if (!isOpen) return null;

  const {
    merchantProfile,
    vaultQRs,
    activeVaultQR,
    setActiveVaultQR,
    recordRealPayment,
    speakPayment,
  } = useApp();

  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState<boolean>(false);

  const numericAmount = parseFloat(amountStr) || undefined;
  const targetVpa = activeVaultQR?.vpa || merchantProfile.vpa || 'merchant@okhdfcbank';

  const upiUri = useMemo(() => {
    try {
      return buildUpiUri({
        vpa: targetVpa,
        payeeName: merchantProfile.businessName || 'DhwaniPay Merchant',
        amount: numericAmount,
        note: note || undefined,
        mcc: merchantProfile.mcc || '5411',
      });
    } catch {
      return `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(
        merchantProfile.businessName
      )}&cu=INR`;
    }
  }, [merchantProfile, numericAmount, note, targetVpa]);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(upiUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateCustomerScan = () => {
    const amt = numericAmount || 50;
    recordRealPayment(amt, 'Customer via Scan & Pay', 'UPI QR Soundbox');
    setSimulatedSuccess(true);
    setTimeout(() => {
      setSimulatedSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Collect Payment
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Dynamic NPCI UPI QR with instant soundbox announcement
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
          {/* Standee Selector if multiple exist */}
          {vaultQRs.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Active QR Standee / Account
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {vaultQRs.map((q) => {
                  const isSelected = q.id === activeVaultQR?.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveVaultQR(q.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{q.appName}</span>
                      <span className="opacity-75 font-normal">({q.vpa})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Bill Amount (₹) <span className="text-slate-400 font-normal">Optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-700">
                ₹
              </span>
              <input
                type="number"
                placeholder="0.00 (leave blank for any amount)"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountStr(amt.toString())}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200/60 transition"
                >
                  +₹{amt}
                </button>
              ))}
              {amountStr && (
                <button
                  onClick={() => setAmountStr('')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Transaction Note */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Bill / Order Note
            </label>
            <input
              type="text"
              placeholder="e.g. Table 4, Grocery items, Order #104"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* QR Code Preview */}
          <div className="py-2">
            <UPIQRCode
              upiUri={upiUri}
              payeeName={merchantProfile.businessName || 'DhwaniPay Merchant'}
              vpa={targetVpa}
              amount={numericAmount}
              size={210}
            />
          </div>

          {/* Success Banner */}
          {simulatedSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 animate-in fade-in">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">Payment Verified & Announced!</p>
                <p className="text-xs text-emerald-700">Soundbox has announced the transaction aloud.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied URI!' : 'Copy UPI Link'}</span>
            </button>

            <button
              onClick={handleSimulateCustomerScan}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Simulate Pay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
