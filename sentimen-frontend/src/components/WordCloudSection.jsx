import React, { useState } from 'react';
import { Tag, Sparkles, Filter } from 'lucide-react';
import { SENTIMENT_CONFIG } from '../utils/constants';

export default function WordCloudSection({ wordFrequency }) {
  const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'positive', 'neutral', 'negative'

  if (!wordFrequency) return null;

  const { top_overall, top_positive, top_neutral, top_negative } = wordFrequency;

  let currentKeywords = [];
  let badgeColorClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
  let accentColor = '#6366f1';

  if (activeTab === 'positive') {
    currentKeywords = top_positive || [];
    badgeColorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    accentColor = '#10b981';
  } else if (activeTab === 'neutral') {
    currentKeywords = top_neutral || [];
    badgeColorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    accentColor = '#f59e0b';
  } else if (activeTab === 'negative') {
    currentKeywords = top_negative || [];
    badgeColorClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    accentColor = '#f43f5e';
  } else {
    currentKeywords = top_overall || [];
  }

  const maxCount = currentKeywords.length > 0 ? Math.max(...currentKeywords.map((k) => k.count)) : 1;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Top Kata Kunci & Frekuensi</h4>
            <p className="text-xs text-slate-400">Kata yang paling sering muncul berdasarkan sentimen</p>
          </div>
        </div>

        {/* Sentiment Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'overall' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Semua ({top_overall?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('positive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'positive' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'}`}
          >
            Positif ({top_positive?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('neutral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'neutral' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-amber-400'}`}
          >
            Netral ({top_neutral?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('negative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'negative' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-rose-400'}`}
          >
            Negatif ({top_negative?.length || 0})
          </button>
        </div>
      </div>

      {/* Keyword Pills Grid */}
      {currentKeywords.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          Tidak ada kata kunci yang cukup signifikan pada kategori ini.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 items-center">
          {currentKeywords.map((item, idx) => {
            // Dynamic scale factor between 0.9 and 1.3 based on count ratio
            const weightRatio = item.count / maxCount;
            const fontSize = weightRatio > 0.7 ? 'text-sm font-bold' : weightRatio > 0.4 ? 'text-xs font-semibold' : 'text-xs font-medium';

            return (
              <div
                key={`${item.word}-${idx}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-105 cursor-default ${badgeColorClass}`}
              >
                <span className={fontSize}>#{item.word}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/30 text-[10px] font-bold">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
