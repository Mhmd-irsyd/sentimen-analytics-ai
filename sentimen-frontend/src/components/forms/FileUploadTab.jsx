import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function FileUploadTab({ onAnalyze, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [columnName, setColumnName] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (validExtensions.includes(fileExt)) {
      setSelectedFile(file);
    } else {
      alert('Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx).');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    onAnalyze(selectedFile, columnName.trim() || null);
  };

  const loadSampleDataset = async () => {
    try {
      const response = await fetch('/sample_dataset.csv');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'sample_dataset.csv', { type: 'text/csv' });
      setSelectedFile(sampleFile);
      setColumnName('ulasan');
    } catch (err) {
      console.error('Failed to load sample dataset', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className={`p-4 rounded-2xl ${selectedFile ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            {selectedFile ? <CheckCircle2 className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
          </div>

          {selectedFile ? (
            <div>
              <p className="text-sm font-bold text-white">{selectedFile.name}</p>
              <p className="text-xs text-emerald-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB — Siap dianalisis
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Tarik & letakkan file <span className="text-indigo-400 font-bold">CSV</span> atau{' '}
                <span className="text-indigo-400 font-bold">Excel (.xlsx)</span> di sini
              </p>
              <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file dari komputer</p>
            </div>
          )}
        </div>
      </div>

      {/* Options & Sample Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Nama kolom komentar:</span>
          <input
            type="text"
            placeholder="Otomatis (atau cth: ulasan)"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-lg text-xs text-slate-200 w-48 placeholder-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={loadSampleDataset}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gunakan Contoh Dataset Demo</span>
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        disabled={!selectedFile || isLoading}
        onClick={handleSubmit}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Menganalisis Dataset dengan IndoBERT...</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4" />
            <span>Mulai Analisis Sentimen Dataset</span>
          </>
        )}
      </button>
    </div>
  );
}
