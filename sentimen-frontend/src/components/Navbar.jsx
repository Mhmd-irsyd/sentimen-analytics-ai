import React from 'react';
import { Sparkles, Activity, Cpu, ShieldCheck } from 'lucide-react';

export default function Navbar({ systemStatus }) {
  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Sentimen<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">IndoBERT Sentiment Intelligence Platform</p>
          </div>
        </div>

        {/* System & Model Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus?.status === 'healthy' ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${systemStatus?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <span className="font-medium text-slate-200">IndoBERT Model:</span>
            <span className="text-indigo-400 font-semibold uppercase">{systemStatus?.device || 'GPU/CPU Ready'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fine-Tuned 3-Class</span>
          </div>
        </div>
      </div>
    </header>
  );
}
