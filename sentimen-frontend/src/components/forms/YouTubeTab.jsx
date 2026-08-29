import React, { useState } from 'react';
import { Video, Link2, Sparkles, Sliders } from 'lucide-react';

export default function YouTubeTab({ onAnalyze, isLoading }) {
  const [url, setUrl] = useState('');
  const [maxComments, setMaxComments] = useState(100);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyze(url.trim(), maxComments);
  };

  const sampleYouTube = () => {
    setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          URL Video YouTube
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
            <Video className="w-5 h-5" />
          </div>
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Max comments slider */}
      <div className="glass-card p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Maksimal Komentar yang Diambil:
          </span>
          <span className="font-bold text-indigo-400 font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
            {maxComments} Komentar
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="500"
          step="20"
          value={maxComments}
          onChange={(e) => setMaxComments(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>20</span>
          <span>100</span>
          <span>250</span>
          <span>500 (Maks)</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!url.trim() || isLoading}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Mengambil & Menganalisis Komentar YouTube...</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span>Scrape & Analisis Sentimen YouTube</span>
          </>
        )}
      </button>
    </form>
  );
}

