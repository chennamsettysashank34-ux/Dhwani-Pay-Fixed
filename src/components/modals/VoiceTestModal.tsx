import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Headphones,
  RotateCcw,
  Languages,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useApp, SUPPORTED_LANGUAGES } from '../../context/AppContext';

interface VoiceTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceTestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const {
    spokenLanguage,
    setSpokenLanguage,
    speechRate,
    setSpeechRate,
    speakCustomPhrase,
    stopAudio,
    isSpeaking,
  } = useApp();

  const [testAmount, setTestAmount] = useState(50);

  const getTestPhrase = (lang: string, amount: number) => {
    switch (lang) {
      case 'Hindi':
        return `भुगतान सूचना प्राप्त हुई। गूगल पे पर ${amount} रुपये प्राप्त हुए।`;
      case 'Telugu':
        return `చెల్లింపు నోటిఫికేషన్ అందింది. గూగుల్ పే లో ${amount} రూపాయలు వచ్చాయి.`;
      case 'Kannada':
        return `ಪಾವತಿ ಅಧಿಸೂಚನೆ ಬಂದಿದೆ. ಗೂಗಲ್ ಪೇ ನಲ್ಲಿ ${amount} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`;
      case 'Tamil':
        return `கட்டண அறிவிப்பு பெறப்பட்டது. கூகிள் பே இல் ${amount} ரூபாய் பெறப்பட்டது.`;
      case 'Malayalam':
        return `പേയ്മെന്റ് അറിയിപ്പ് ലഭിച്ചു. ഗൂഗിൾ പേ വഴി ${amount} രൂപ ലഭിച്ചു.`;
      case 'Marathi':
        return `पेमेंट सूचना प्राप्त झाली. गुगल पे वर ${amount} रुपये मिळाले.`;
      default:
        return `Payment notification received. Fifty rupees received on Google Pay.`;
    }
  };

  const handlePlay = () => {
    const phrase = getTestPhrase(spokenLanguage, testAmount);
    speakCustomPhrase(phrase);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Voice & Audio Soundbox Test
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verify speaker clarity and regional language speech accents
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
          {/* Animated Speaker Badge */}
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="relative w-24 h-24 rounded-3xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner">
              <Volume2 className={`w-12 h-12 ${isSpeaking ? 'animate-bounce' : ''}`} />
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Let's hear your soundbox
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Hear announcements aloud through device speakers before relying on it during peak customer hours.
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Spoken Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.name === spokenLanguage;
                return (
                  <button
                    key={lang.name}
                    onClick={() => setSpokenLanguage(lang.name)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-extrabold shadow-sm'
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

          {/* Speech Speed Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Speech Rate / Speed
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
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>0.7x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>1.3x (Faster)</span>
            </div>
          </div>

          {/* Sample Text Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Announcement Sample Preview
            </span>
            <p className="text-sm font-semibold text-slate-800 italic">
              "{getTestPhrase(spokenLanguage, testAmount)}"
            </p>
          </div>

          {/* Play / Stop Button */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={isSpeaking ? stopAudio : handlePlay}
              className={`flex-1 py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] ${
                isSpeaking
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span>Stop Soundbox Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>Play Test Announcement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
