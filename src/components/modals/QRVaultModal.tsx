import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  Copy,
  ExternalLink,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { APP_PRESETS } from '../../constants/vaultPresets';
import { QRVaultApp, VaultQRCode } from '../../types';
import { UPIQRCode } from '../UPIQRCode';
import { buildUpiUri } from '../../utils/upi';

interface QRVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_APPS: QRVaultApp[] = [
  'Google Pay',
  'PhonePe',
  'Paytm',
  'BharatPe',
  'BHIM UPI',
  'Amazon Pay',
  'CRED',
  'Bank QR',
  'Other',
];

export function QRVaultModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const {
    vaultQRs,
    activeVaultQR,
    addVaultQR,
    removeVaultQR,
    setActiveVaultQR,
    merchantProfile,
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [fullscreenQR, setFullscreenQR] = useState<VaultQRCode | null>(null);

  // Form
  const [formApp, setFormApp] = useState<QRVaultApp>('Google Pay');
  const [formTitle, setFormTitle] = useState('GPay Counter Standee');
  const [formVpa, setFormVpa] = useState('');
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  const handleSelectApp = (app: QRVaultApp) => {
    setFormApp(app);
    const preset = APP_PRESETS[app];
    if (preset) {
      setFormTitle(preset.defaultTitle);
      if (!formVpa) {
        setFormVpa(preset.sampleVpa);
      }
    }
  };

  const handleSaveQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVpa || !formVpa.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. yourstore@upi)');
      return;
    }

    addVaultQR({
      appName: formApp,
      title: formTitle || `${formApp} Standee`,
      vpa: formVpa,
      isPrimary: formIsPrimary || vaultQRs.length === 0,
    });

    setIsAdding(false);
    setFormVpa('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                QR Standee Vault
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Store and switch counter standees (PhonePe, GPay, Paytm)
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
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Configured Standees ({vaultQRs.length})
            </p>
            {!isAdding && (
              <button
                onClick={() => {
                  setIsAdding(true);
                  handleSelectApp('Google Pay');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Standee</span>
              </button>
            )}
          </div>

          {/* Add Standee Form */}
          {isAdding && (
            <form onSubmit={handleSaveQR} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">Add New Counter QR</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Provider / Payment App
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALL_APPS.slice(0, 6).map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => handleSelectApp(app)}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        formApp === app
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Standee Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Counter Standee"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  UPI VPA ID
                </label>
                <input
                  type="text"
                  value={formVpa}
                  onChange={(e) => setFormVpa(e.target.value)}
                  placeholder="e.g. sharma@okhdfcbank"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={formIsPrimary}
                  onChange={(e) => setFormIsPrimary(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="primaryCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as Primary Counter Standee
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
              >
                Save to Vault
              </button>
            </form>
          )}

          {/* Standees List */}
          <div className="space-y-3">
            {vaultQRs.map((qr) => {
              const isSelected = qr.id === activeVaultQR?.id;
              const preset = APP_PRESETS[qr.appName] || APP_PRESETS.Other;
              return (
                <div
                  key={qr.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500/80 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        backgroundColor: preset.bgLight,
                        color: preset.textColor,
                      }}
                    >
                      {qr.appName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {qr.title}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black uppercase">
                            Active Counter
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        UPI: <span className="text-slate-800">{qr.vpa}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFullscreenQR(qr)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                      title="View Full Standee"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {!isSelected && (
                      <button
                        onClick={() => setActiveVaultQR(qr.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                      >
                        Set Active
                      </button>
                    )}

                    {vaultQRs.length > 1 && (
                      <button
                        onClick={() => removeVaultQR(qr.id)}
                        className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fullscreen Standee View */}
      {fullscreenQR && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setFullscreenQR(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {fullscreenQR.title}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              {fullscreenQR.appName} Merchant Standee
            </p>
            <UPIQRCode
              upiUri={buildUpiUri({
                vpa: fullscreenQR.vpa || 'merchant@upi',
                payeeName: merchantProfile.businessName || 'DhwaniPay Merchant',
              })}
              payeeName={merchantProfile.businessName}
              vpa={fullscreenQR.vpa}
              size={240}
            />
            <button
              onClick={() => setFullscreenQR(null)}
              className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close Standee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
