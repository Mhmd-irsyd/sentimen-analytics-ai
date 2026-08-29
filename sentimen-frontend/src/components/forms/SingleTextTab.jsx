import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare } from 'lucide-react';
import { SAMPLE_TEXTS } from '../../utils/constants';
import Badge from '../Badge';
import { formatPercent } from '../../utils/formatters';

export default function SingleTextTab({ onAnalyzeSingle, singleResult, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAnalyzeSingle(text.trim());
  };

  const handleSampleClick = (sample) => {
    setText(sample);
    onAnalyzeSingle(sample);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Teks Ulasan / Kalimat
          </label>
          <textarea
            rows={4}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ketik atau tempel kalimat ulasan di sini (contoh: Barang sangat bagus original rekomen seller!)..."
            className="glass-input w-full p-4 rounded-xl text-sm text-slate-100 placeholder-slate-500 resize-none leading-relaxed"
          />
        </div>

        {/* Sample click chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Coba Contoh:
          </span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleClick(sample)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors truncate max-w-[220px]"
            >
              {sample}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses Inferensi IndoBERT...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analisis Sentimen Kalimat Ini</span>
            </>
          )}
        </button>
      </form>

      {/* Instant Result Box */}
      {singleResult && (
        <div className="glass-card rounded-2xl p-6 border-indigo-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hasil Klasifikasi AI</span>
              <h4 className="text-base font-bold text-white mt-0.5">Klasifikasi IndoBERT</h4>
            </div>
            <div className="flex items-center gap-3">
              <Badge sentiment={singleResult.sentiment} className="text-sm px-3 py-1.5" />
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                {Math.round(singleResult.confidence * 100)}% Conf
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Teks Setelah Preprocessing & Slang Normalizer:</span>
              <p className="text-xs font-mono text-emerald-400 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                {singleResult.cleaned_text || singleResult.original_text}
              </p>
            </div>

            {/* Probability Bars */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block">Distribusi Probabilitas Kelas:</span>
              {Object.entries(singleResult.probabilities || {}).map(([cls, prob]) => (
                <div key={cls} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">{cls}</span>
                    <span className="font-mono font-bold text-slate-200">{formatPercent(prob * 100)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cls === 'Positif'
                          ? 'bg-emerald-500'
                          : cls === 'Netral'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
