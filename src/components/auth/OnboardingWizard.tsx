import React, { useState } from 'react';
import {
  Store,
  QrCode,
  Languages,
  Volume2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useApp, SUPPORTED_LANGUAGES } from '../../context/AppContext';

export function OnboardingWizard() {
  const { completeOnboarding, speakCustomPhrase } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form data
  const [businessName, setBusinessName] = useState('');
  const [vpa, setVpa] = useState('');
  const [mcc, setMcc] = useState('5411');
  const [language, setLanguage] = useState('Hindi');
  const [errorMsg, setErrorMsg] = useState('');

  const handleNextStep1 = () => {
    if (!businessName.trim()) {
      setErrorMsg('Please enter your store or business name.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    const cleanVpa = vpa.trim();
    if (!cleanVpa || !cleanVpa.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. yourstore@okhdfcbank or 9876543210@paytm).');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handlePlayVoiceSample = () => {
    let sample = '';
    switch (language) {
      case 'Hindi':
        sample = `${businessName || 'दुकान'} पर पचास रुपये प्राप्त हुए।`;
        break;
      case 'Telugu':
        sample = `${businessName || 'షాప్'} లో యాభై రూపాయలు వచ్చాయి.`;
        break;
      case 'Kannada':
        sample = `${businessName || 'ಅಂಗಡಿ'} ನಲ್ಲಿ ಐವತ್ತು ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`;
        break;
      case 'Tamil':
        sample = `${businessName || 'கடை'} இல் ஐம்பது ரூபாய் பெறப்பட்டது.`;
        break;
      case 'Malayalam':
        sample = `${businessName || 'കട'} വഴി അമ്പത് രൂപ ലഭിച്ചു.`;
        break;
      case 'Marathi':
        sample = `${businessName || 'दुकान'} वर पन्नास रुपये प्राप्त झाले.`;
        break;
      default:
        sample = `Fifty rupees received at ${businessName || 'Store'}.`;
    }
    speakCustomPhrase(sample);
  };

  const handleFinish = () => {
    completeOnboarding({
      businessName: businessName.trim(),
      vpa: vpa.trim(),
      language,
      mcc,
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#17231D] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-7 shadow-xl border border-slate-200/90 space-y-6 animate-in fade-in duration-200">
        {/* Step Progress Indicator */}
        <div>
          <div className="flex items-center justify-between text-xs font-black text-slate-400 mb-2">
            <span>STEP {step} OF 3</span>
            <span>
              {step === 1 ? 'STORE IDENTITY' : step === 2 ? 'UPI SETUP' : 'VOICE LANGUAGE'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= 1 ? 'bg-[#087F5B]' : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= 2 ? 'bg-[#087F5B]' : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= 3 ? 'bg-[#087F5B]' : 'bg-slate-200'
              }`}
            />
          </div>
        </div>

        {/* Step 1: Store Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  What is your shop name?
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  This name appears on customer payment QR codes & receipts
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Shop / Store Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sharma Kirana & General Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:bg-white transition"
                autoFocus
              />
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-600 animate-in fade-in">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={handleNextStep1}
              className="w-full py-3.5 rounded-xl bg-[#087F5B] hover:bg-[#07533F] text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Continue to UPI Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: UPI ID & Payment Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Link your primary UPI ID
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Customer payments will be deposited directly into this account
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Merchant UPI ID (VPA)
              </label>
              <input
                type="text"
                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:bg-white transition"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Supports all bank VPAs (HDFC, SBI, Axis, ICICI, Paytm, PhonePe, Google Pay).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Merchant Category (MCC)
              </label>
              <select
                value={mcc}
                onChange={(e) => setMcc(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#087F5B]"
              >
                <option value="5411">5411 - Grocery Stores & Supermarkets</option>
                <option value="5812">5812 - Eating Places & Restaurants</option>
                <option value="5311">5311 - Department Stores & Retail</option>
                <option value="5912">5912 - Drug Stores & Pharmacies</option>
                <option value="5499">5499 - Miscellaneous Food Stores</option>
              </select>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-600 animate-in fade-in">{errorMsg}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="flex-1 py-3.5 rounded-xl bg-[#087F5B] hover:bg-[#07533F] text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Continue to Voice Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Soundbox Voice Language */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Choose soundbox voice
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select your regional language for payment announcements
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.name === language;
                return (
                  <button
                    key={lang.name}
                    type="button"
                    onClick={() => setLanguage(lang.name)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm font-bold">{lang.name}</span>
                    <span className="text-xs opacity-75">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>

            {/* Test Voice Sample */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-600">
                <span className="font-bold text-slate-900 block">Hear sample audio</span>
                <span>Test speech output through your phone</span>
              </div>
              <button
                type="button"
                onClick={handlePlayVoiceSample}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Sample</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-xl bg-[#087F5B] hover:bg-[#07533F] text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Complete Setup & Enter Soundbox</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
