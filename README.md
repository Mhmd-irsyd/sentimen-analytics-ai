# Sentimen Analytics AI (IndoBERT)

Platform web modern, scalable, dan modular untuk Analisis Sentimen berbasis AI menggunakan model fine-tuned **IndoBERT** (3 kelas: **Positif**, **Netral**, **Negatif**). Aplikasi ini dirancang untuk menganalisis komentar multi-sumber: ulasan e-commerce (CSV/Excel), YouTube Video, Instagram Post, serta Playground Single Text.

---

## Arsitektur Proyek (Decoupled)

```
sentimen-analytics-ai/
├── sentimen-backend/        # Backend API (Python, FastAPI, PyTorch, Transformers, Pandas)
│   ├── app/
│   │   ├── api/v1/          # REST API Routers (analyze, youtube, instagram, system)
│   │   ├── core/            # Config & Logging
│   │   ├── models/          # IndoBERT Model Engine & Indonesian NLP Preprocessor
│   │   ├── schemas/         # Pydantic Request & Response Schemas
│   │   ├── services/        # Analytics, File Parser, YouTube & IG Ingestion
│   │   └── utils/           # Indonesian Slang Dictionary & Stopwords
│   └── tests/               # Unit & Inference Tests
│
└── sentimen-frontend/       # Frontend UI (React.js, Vite, Tailwind CSS, Recharts, Lucide Icons)
    ├── src/
    │   ├── components/      # UI Components (MetricCards, SentimentCharts, CommentsTable, dll)
    │   ├── services/        # Axios API Client
    │   └── utils/           # Formatters & Constants
    └── public/
        └── sample_dataset.csv # Contoh dataset siap uji
```

---

## Fitur Utama

1. **Model IndoBERT Lokal**:
   - Model `BertForSequenceClassification` yang telah di-fine-tune untuk klasifikasi sentimen bahasa Indonesia.
   - Batch Inference dengan auto-detection akselerasi GPU (CUDA) atau fallback CPU.
2. **Indonesian NLP Preprocessor**:
   - Pembersihan teks, penanganan emoji, penghapusan karakter berulang (*word elongation*), dan normalisasi kata *slang/alay*.
3. **Multi-Source Ingestion**:
   - **Upload File**: Parsing CSV dan Excel (.xlsx) dengan auto-detection kolom komentar.
   - **YouTube Video**: Scrape komentar video YouTube secara langsung berdasarkan link video.
   - **Instagram Post**: Ingestion komentar postingan / reel Instagram.
   - **Single Text Playground**: Uji langsung kalimat tertentu dengan visualisasi probabilitas tiap kelas.
4. **Interactive Analytics Dashboard**:
   - KPI Summary Cards (Total Komentar, % Positif, % Netral, % Negatif, Net Sentiment Score).
   - Donut Chart & Confidence Distribution Bar Chart (Recharts).
   - Top Keywords / Word Cloud filterable berdasarkan sentimen.
   - Filterable, Searchable, dan Paginated Data Table dengan perbandingan teks hasil preprocessing.
   - Ekspor Laporan ke CSV dan Cetak / PDF.

---

## Panduan Menjalankan Aplikasi

### 1. Menjalankan Backend (`sentimen-backend`)

Buka terminal pertama di folder `sentimen-backend`:

```bash
cd sentimen-backend

# Aktifkan virtual environment
# Windows:
.\venv\Scripts\activate

# Jalankan server FastAPI dengan Uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Docs (Swagger UI): [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Health Check: [http://localhost:8000/api/v1/system/health](http://localhost:8000/api/v1/system/health)

---

### 2. Menjalankan Frontend (`sentimen-frontend`)

Buka terminal kedua di folder `sentimen-frontend`:

```bash
cd sentimen-frontend

# Jalankan Vite dev server
npm run dev
```

- Buka di browser: [http://localhost:5173](http://localhost:5173)

---

## Pengujian Otomatis

Untuk menjalankan unit test inferensi model IndoBERT dan pipeline preprocessing:

```bash
cd sentimen-backend
.\venv\Scripts\python tests\test_inference.py
```
