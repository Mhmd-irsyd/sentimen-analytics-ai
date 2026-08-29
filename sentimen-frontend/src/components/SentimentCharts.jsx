import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { SENTIMENT_CONFIG } from '../utils/constants';
import { formatPercent } from '../utils/formatters';

export default function SentimentCharts({ summary, results }) {
  if (!summary) return null;

  const pieData = [
    { name: 'Positif', value: summary.positive_count, percentage: summary.positive_percentage, color: SENTIMENT_CONFIG.Positif.color },
    { name: 'Netral', value: summary.neutral_count, percentage: summary.neutral_percentage, color: SENTIMENT_CONFIG.Netral.color },
    { name: 'Negatif', value: summary.negative_count, percentage: summary.negative_percentage, color: SENTIMENT_CONFIG.Negatif.color },
  ];

  // Group confidence scores into buckets (0.5-0.6, 0.6-0.7, 0.7-0.8, 0.8-0.9, 0.9-1.0)
  const confidenceBuckets = [
    { range: '50-60%', count: 0 },
    { range: '60-70%', count: 0 },
    { range: '70-80%', count: 0 },
    { range: '80-90%', count: 0 },
    { range: '90-100%', count: 0 },
  ];

  (results || []).forEach((item) => {
    const conf = item.confidence || 0;
    if (conf >= 0.9) confidenceBuckets[4].count++;
    else if (conf >= 0.8) confidenceBuckets[3].count++;
    else if (conf >= 0.7) confidenceBuckets[2].count++;
    else if (conf >= 0.6) confidenceBuckets[1].count++;
    else confidenceBuckets[0].count++;
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-white text-sm">{data.name}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Jumlah: <span className="font-bold text-white">{data.value} komentar</span>
          </p>
          <p className="text-xs text-slate-400">
            Proporsi: <span className="font-bold text-indigo-400">{formatPercent(data.percentage)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Donut Pie Chart */}
      <div className="lg:col-span-6 glass-card rounded-2xl p-6 relative flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Distribusi Sentimen</h4>
              <p className="text-xs text-slate-400">Proporsi klasifikasi 3-kelas IndoBERT</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Dominan: <strong className="text-indigo-400">{summary.dominant_sentiment}</strong>
          </span>
        </div>

        <div className="h-64 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text in donut chart */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400 font-medium">Dominan</span>
            <span className="text-lg font-black text-white">{summary.dominant_sentiment}</span>
          </div>
        </div>

        {/* Custom Legend */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
          {pieData.map((item) => (
            <div key={item.name} className="flex flex-col items-center p-2 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-slate-300">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-white">{formatPercent(item.percentage)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Confidence Score Distribution Bar Chart */}
      <div className="lg:col-span-6 glass-card rounded-2xl p-6 relative flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Tingkat Keyakinan Model (Confidence)</h4>
              <p className="text-xs text-slate-400">Sebaran probabilitas inferensi IndoBERT</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Rata-rata: {Math.round(summary.average_confidence * 100)}%
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs">
                        <span className="text-slate-400">Rentang: {payload[0].payload.range}</span>
                        <p className="font-bold text-indigo-400 mt-0.5">{payload[0].value} komentar</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Semakin tinggi rentang probabilitas, semakin akurat keyakinan inferensi AI.</span>
        </div>
      </div>
    </div>
  );
}
