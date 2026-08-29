import React from 'react';
import { Heart, Sparkles, Code2, Layers } from 'lucide-react';


export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/80 py-8 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-300">SentimenAI Analytics</span>
          <span>— Powered by IndoBERT & FastAPI</span>
        </div>
        <p className="text-slate-500">
          Dirancang untuk analisis sentimen e-commerce, ulasan produk, Instagram, & YouTube.
        </p>
      </div>
    </footer>
  );
}
