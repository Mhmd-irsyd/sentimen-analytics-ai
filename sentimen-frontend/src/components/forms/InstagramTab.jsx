import React, { useState } from 'react';
import { Camera, Link2, Sparkles, Sliders } from 'lucide-react';

export default function InstagramTab({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState('');
  const [maxComments, setMaxComments] = useState(100);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyze(url.trim(), maxComments);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          URL Post / Reel Instagram
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
            <Camera className="w-5 h-5" />
          </div>
          <input
            type="url"
            required
            placeholder="https://www.instagram.com/p/... atau https://www.instagram.com/reel/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Max comments selector & presets */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Batas Jumlah Komentar yang Diambil:
          </span>
          <span className="font-bold text-pink-400 font-mono px-3 py-1 rounded-lg bg-pink-500/10 border border-pink-500/30 text-xs">
            {maxComments} Komentar
          </span>
        </div>

        <input
          type="range"
          min="20"
          max="300"
          step="10"
          value={maxComments}
          onChange={(e) => setMaxComments(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />

        {/* Quick preset buttons */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400">Pilih Cepat:</span>
          <div className="flex items-center gap-1.5">
            {[30, 50, 100, 200, 300].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setMaxComments(count)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  maxComments === count
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!url.trim() || isLoading}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Mengambil & Menganalisis Komentar Instagram...</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>Scrape & Analisis Sentimen Instagram</span>
          </>
        )}
      </button>
    </form>
  );
}
