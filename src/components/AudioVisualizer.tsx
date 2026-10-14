import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function AudioVisualizer() {
  const { isSpeaking, currentSpeakingText, stopAudio, spokenLanguage } = useApp();
  const [heights, setHeights] = useState<number[]>([12, 18, 24, 16, 28, 22, 14, 26, 30, 20, 16, 24]);

  useEffect(() => {
    if (!isSpeaking) return;

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: 12 }, () => Math.floor(10 + Math.random() * 26))
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  if (!isSpeaking) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Volume2 className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Soundbox Speaking ({spokenLanguage})
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-sm font-semibold text-slate-100 line-clamp-1 max-w-[200px] sm:max-w-[260px]">
              "{currentSpeakingText}"
            </p>
          </div>
        </div>

        {/* Waveform Bars */}
        <div className="flex items-center gap-1 h-8 px-2">
          {heights.slice(0, 6).map((h, i) => (
            <div
              key={i}
              className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        <button
          onClick={stopAudio}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          title="Stop speech"
        >
          <VolumeX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
