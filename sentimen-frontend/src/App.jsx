import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  FileSpreadsheet,
  Video,
  Camera,
  Edit3,
  Sparkles,
  Layers,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import Navbar from './components/Navbar';

import Footer from './components/Footer';
import MetricCards from './components/MetricCards';
import SentimentCharts from './components/SentimentCharts';
import WordCloudSection from './components/WordCloudSection';
import CommentsTable from './components/CommentsTable';
import ExportReport from './components/ExportReport';
import FileUploadTab from './components/forms/FileUploadTab';
import YouTubeTab from './components/forms/YouTubeTab';
import InstagramTab from './components/forms/InstagramTab';
import SingleTextTab from './components/forms/SingleTextTab';
import apiService from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('file'); // 'file', 'youtube', 'instagram', 'single'
  const [systemStatus, setSystemStatus] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Check backend health & model status on initial mount
  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const data = await apiService.getHealth();
      setSystemStatus(data);
    } catch (err) {
      console.warn('Backend service offline or loading', err);
      setSystemStatus({ status: 'standby', device: 'cpu' });
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#38bdf8'],
    });
  };

  // 1. Analyze File Upload (CSV/Excel)
  const handleAnalyzeFile = async (file, columnName) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiService.analyzeFile(file, columnName);
      setAnalysisData(response);
      triggerConfetti();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Terjadi kesalahan saat menganalisis file.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Analyze YouTube
  const handleAnalyzeYouTube = async (url, maxComments) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiService.analyzeYouTube(url, maxComments);
      setAnalysisData(response);
      triggerConfetti();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Gagal mengambil komentar YouTube.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Analyze Instagram
  const handleAnalyzeInstagram = async (url, maxComments) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiService.analyzeInstagram(url, maxComments);
      setAnalysisData(response);
      triggerConfetti();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Gagal menganalisis komentar Instagram.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Analyze Single Text (Playground)
  const handleAnalyzeSingle = async (text) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiService.analyzeSingleText(text);
      setSingleResult(response.result);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Gagal memproses kalimat.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar systemStatus={systemStatus} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4 py-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Sentiment Intelligence Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Analisis Sentimen Akurat dengan{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              IndoBERT AI
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Klasifikasi sentimen otomatis 3 kelas (<strong>Positif</strong>, <strong>Netral</strong>, <strong>Negatif</strong>) 
            untuk ulasan e-commerce, media sosial Instagram, dan YouTube berbasis Deep Learning.
          </p>
        </section>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block text-rose-200">Gagal Memproses:</strong>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-rose-400 hover:text-rose-200 font-semibold px-2 py-1"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Input Panel with Source Tabs */}
        <section className="max-w-4xl mx-auto glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border-slate-800 relative">
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload CSV / Excel</span>
            </button>

            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'youtube'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>YouTube Video</span>
            </button>

            <button
              onClick={() => setActiveTab('instagram')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'instagram'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Instagram Post</span>
            </button>

            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Playground Teks</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="transition-all">
            {activeTab === 'file' && <FileUploadTab onAnalyze={handleAnalyzeFile} isLoading={isLoading} />}
            {activeTab === 'youtube' && <YouTubeTab onAnalyze={handleAnalyzeYouTube} isLoading={isLoading} />}
            {activeTab === 'instagram' && <InstagramTab onAnalyze={handleAnalyzeInstagram} isLoading={isLoading} />}
            {activeTab === 'single' && (
              <SingleTextTab
                onAnalyzeSingle={handleAnalyzeSingle}
                singleResult={singleResult}
                isLoading={isLoading}
              />
            )}
          </div>
        </section>

        {/* Dashboard Analytics View */}
        {analysisData && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
            {/* Header Result info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Hasil Dashboard Analisis Sentimen
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize">
                    {analysisData.metadata?.source || 'Dataset'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Sumber: <strong className="text-slate-200">{analysisData.metadata?.source_title}</strong>
                </p>
              </div>

              <ExportReport data={analysisData} />
            </div>

            {/* 1. KPI Metric Summary Cards */}
            <MetricCards summary={analysisData.summary} metadata={analysisData.metadata} />

            {/* 2. Interactive Visualizations (Charts) */}
            <SentimentCharts summary={analysisData.summary} results={analysisData.results} />

            {/* 3. Word Cloud & Keyword Frequency Breakdown */}
            <WordCloudSection wordFrequency={analysisData.word_frequency} />

            {/* 4. Filterable & Paginated Comments Table */}
            <CommentsTable results={analysisData.results} />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
