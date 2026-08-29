import React from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';

export default function ExportReport({ data }) {
  if (!data || !data.results || data.results.length === 0) return null;

  const exportToCSV = () => {
    const headers = ['ID', 'Teks Asli', 'Teks Bersih', 'Sentimen', 'Confidence', 'Author', 'Likes', 'Prob_Positif', 'Prob_Netral', 'Prob_Negatif'];
    const rows = data.results.map((r) => [
      r.id,
      `"${(r.original_text || '').replace(/"/g, '""')}"`,
      `"${(r.cleaned_text || '').replace(/"/g, '""')}"`,
      r.sentiment,
      r.confidence,
      `"${(r.author || '').replace(/"/g, '""')}"`,
      r.likes || 0,
      r.probabilities?.Positif || 0,
      r.probabilities?.Netral || 0,
      r.probabilities?.Negatif || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentimen_analysis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-card rounded-2xl border-slate-800">
      <div>
        <h5 className="text-sm font-bold text-white">Ekspor & Bagikan Laporan</h5>
        <p className="text-xs text-slate-400">Unduh hasil klasifikasi IndoBERT untuk reporting bisnis atau riset</p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all text-xs font-semibold"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download CSV</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all text-xs font-semibold"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / PDF</span>
        </button>
      </div>
    </div>
  );
}
