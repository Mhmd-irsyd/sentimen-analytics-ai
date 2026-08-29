import React from 'react';
import { MessageSquare, ThumbsUp, Minus, ThumbsDown, TrendingUp, Zap } from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

export default function MetricCards({ summary, metadata }) {
  if (!summary) return null;

  const {
    total_comments,
    positive_count,
    neutral_count,
    negative_count,
    positive_percentage,
    neutral_percentage,
    negative_percentage,
    net_sentiment_score,
    dominant_sentiment,
    average_confidence
  } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Komentar */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Komentar</span>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatNumber(total_comments)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Proses dalam {metadata?.processing_time_seconds || 0}s</span>
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 2. Sentimen Positif */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden border-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Positif</span>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ThumbsUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatPercent(positive_percentage)}
            </h3>
            <span className="text-xs text-emerald-400 font-medium">({formatNumber(positive_count)})</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${positive_percentage}%` }}></div>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 3. Sentimen Netral */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden border-amber-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Netral</span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Minus className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatPercent(neutral_percentage)}
            </h3>
            <span className="text-xs text-amber-400 font-medium">({formatNumber(neutral_count)})</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${neutral_percentage}%` }}></div>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 4. Sentimen Negatif */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden border-rose-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Negatif</span>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ThumbsDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatPercent(negative_percentage)}
            </h3>
            <span className="text-xs text-rose-400 font-medium">({formatNumber(negative_count)})</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-700" style={{ width: `${negative_percentage}%` }}></div>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 5. Net Sentiment Score (NSS) */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden border-indigo-500/30 glow-brand">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Net Score (NSS)</span>
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${net_sentiment_score > 0 ? 'text-emerald-400' : net_sentiment_score < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
              {net_sentiment_score > 0 ? `+${net_sentiment_score}` : net_sentiment_score}
            </h3>
            <span className="text-[11px] text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-indigo-200/80 mt-1 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3 text-indigo-400 inline" />
            <span>Avg Conf: {Math.round(average_confidence * 100)}%</span>
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
      </div>
    </div>
  );
}
