import React, { useState } from 'react';
import { X, Store, Check, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MerchantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MerchantProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const { merchantProfile, updateMerchantProfile } = useApp();

  const [businessName, setBusinessName] = useState(merchantProfile.businessName);
  const [vpa, setVpa] = useState(merchantProfile.vpa);
  const [phone, setPhone] = useState(merchantProfile.phone || '');
  const [mcc, setMcc] = useState(merchantProfile.mcc || '5411');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMerchantProfile({
      businessName: businessName.trim(),
      vpa: vpa.trim(),
      phone: phone.trim(),
      mcc: mcc.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Merchant Profile
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Store name and primary UPI ID for QR payments
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Shop / Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sharma General Store"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Primary UPI ID (VPA)
            </label>
            <input
              type="text"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="e.g. sharma.store@okhdfcbank"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Contact Phone (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Merchant Category Code (MCC)
            </label>
            <select
              value={mcc}
              onChange={(e) => setMcc(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="5411">5411 - Grocery Stores & Supermarkets</option>
              <option value="5812">5812 - Eating Places & Restaurants</option>
              <option value="5311">5311 - Department Stores</option>
              <option value="5912">5912 - Drug Stores & Pharmacies</option>
              <option value="5499">5499 - Miscellaneous Food Stores</option>
            </select>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Merchant details saved successfully!</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-[0.98]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
