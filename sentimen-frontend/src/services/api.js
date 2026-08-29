import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for large datasets/scraping
});

export const apiService = {
  // System Health & Info
  getHealth: async () => {
    const res = await apiClient.get('/system/health');
    return res.data;
  },

  getModelInfo: async () => {
    const res = await apiClient.get('/system/info');
    return res.data;
  },

  // Single Text Analysis
  analyzeSingleText: async (text) => {
    const res = await apiClient.post('/analyze/text', { text });
    return res.data;
  },

  // Batch Text Analysis
  analyzeBatchTexts: async (texts) => {
    const res = await apiClient.post('/analyze/batch', { texts });
    return res.data;
  },

  // File Dataset Analysis (CSV / XLSX)
  analyzeFile: async (file, columnName = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (columnName) {
      formData.append('column_name', columnName);
    }
    const res = await apiClient.post('/analyze/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // YouTube Comment Scraper & Analysis
  analyzeYouTube: async (url, maxComments = 100) => {
    const res = await apiClient.post('/youtube', {
      url,
      max_comments: maxComments,
    });
    return res.data;
  },

  // Instagram Comment Scraper & Analysis
  analyzeInstagram: async (url, maxComments = 50) => {
    const res = await apiClient.post('/instagram', {
      url,
      max_comments: maxComments,
    });
    return res.data;
  },
};

export default apiService;
