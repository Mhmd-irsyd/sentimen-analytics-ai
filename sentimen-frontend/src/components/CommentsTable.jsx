import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  User,
  ExternalLink,
} from 'lucide-react';
import Badge from './Badge';
import { formatPercent } from '../utils/formatters';

export default function CommentsTable({ results }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc'); // 'id-asc', 'conf-desc', 'conf-asc', 'likes-desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const filteredResults = useMemo(() => {
    if (!results) return [];

    return results
      .filter((item) => {
        const matchesSentiment = selectedSentiment === 'ALL' || item.sentiment === selectedSentiment;
        const matchesSearch =
          (item.original_text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.author || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSentiment && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'conf-desc') return (b.confidence || 0) - (a.confidence || 0);
        if (sortBy === 'conf-asc') return (a.confidence || 0) - (b.confidence || 0);
        if (sortBy === 'likes-desc') return (b.likes || 0) - (a.likes || 0);
        return a.id - b.id;
      });
  }, [results, searchTerm, selectedSentiment, sortBy]);

  const totalPages = Math.ceil(filteredResults.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  const toggleExpand = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Table Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="font-bold text-white text-base">Tabel Data Komentar & Klasifikasi</h4>
          <p className="text-xs text-slate-400">
            Ditemukan {filteredResults.length} dari total {results?.length || 0} komentar
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari komentar / author..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {['ALL', 'Positif', 'Netral', 'Negatif'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedSentiment(cat);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedSentiment === cat
                    ? cat === 'Positif'
                      ? 'bg-emerald-600 text-white'
                      : cat === 'Netral'
                      ? 'bg-amber-600 text-white'
                      : cat === 'Negatif'
                      ? 'bg-rose-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : cat}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input px-3 py-2 rounded-xl text-xs text-slate-300 bg-slate-900 border-slate-800"
          >
            <option value="id-asc">Urutkan: Default (ID)</option>
            <option value="conf-desc">Confidence Tertinggi</option>
            <option value="conf-asc">Confidence Terendah</option>
            <option value="likes-desc">Likes Terbanyak</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[280px]">Teks Komentar</th>
              <th className="py-3 px-4 w-28 text-center">Sentimen</th>
              <th className="py-3 px-4 w-28 text-center">Confidence</th>
              <th className="py-3 px-4 w-24 text-center">Author / Info</th>
              <th className="py-3 px-4 w-12 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  Tidak ada komentar yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const isExpanded = expandedRowId === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpand(item.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-500">{item.id}</td>
                      <td className="py-3 px-4 font-normal text-slate-200 leading-relaxed">
                        <p className="line-clamp-2">{item.original_text}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge sentiment={item.sentiment} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-indigo-300">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <span className="truncate max-w-[100px] font-medium text-slate-300">
                            {item.author || 'User'}
                          </span>
                          {item.likes > 0 && (
                            <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                              <ThumbsUp className="w-2.5 h-2.5 inline" /> {item.likes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 mx-auto" />
                        )}
                      </td>
                    </tr>

                    {/* Expandable row content */}
                    {isExpanded && (
                      <tr className="bg-slate-900/60 border-t border-b border-indigo-500/20">
                        <td colSpan="6" className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Text normalization breakdown */}
                            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Hasil Normalisasi Teks (NLP Preprocessor):</span>
                              </div>
                              <p className="text-xs text-emerald-400/90 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                                {item.cleaned_text || item.original_text}
                              </p>
                            </div>

                            {/* Probabilities Breakdown */}
                            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                              <span className="text-xs font-semibold text-slate-300 block mb-2">
                                Sebaran Probabilitas 3 Kelas:
                              </span>
                              <div className="space-y-2 text-xs">
                                {Object.entries(item.probabilities || {}).map(([cls, prob]) => (
                                  <div key={cls} className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-slate-400 font-medium">{cls}</span>
                                      <span className="font-mono font-bold text-slate-200">
                                        {formatPercent(prob * 100)}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
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
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Menampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="glass-input px-2 py-1 rounded-lg text-xs bg-slate-900 text-slate-200 border-slate-800"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>baris per halaman</span>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-300">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
