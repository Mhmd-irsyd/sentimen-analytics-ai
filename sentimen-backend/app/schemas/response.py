from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SentimentItem(BaseModel):
    id: int
    original_text: str
    cleaned_text: str
    sentiment: str  # "Positif", "Netral", "Negatif"
    confidence: float
    probabilities: Dict[str, float]
    author: Optional[str] = None
    likes: Optional[int] = 0
    published_at: Optional[str] = None

class SentimentSummary(BaseModel):
    total_comments: int
    positive_count: int
    neutral_count: int
    negative_count: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float
    dominant_sentiment: str
    net_sentiment_score: float  # (% Positive - % Negative)
    average_confidence: float

class KeywordFrequencyItem(BaseModel):
    word: str
    count: int

class WordFrequencyBreakdown(BaseModel):
    top_overall: List[KeywordFrequencyItem]
    top_positive: List[KeywordFrequencyItem]
    top_neutral: List[KeywordFrequencyItem]
    top_negative: List[KeywordFrequencyItem]

class DashboardMetadata(BaseModel):
    source: str  # "file", "youtube", "instagram", "text", "batch"
    source_title: Optional[str] = "Dataset Analysis"
    source_url: Optional[str] = None
    processed_count: int
    processing_time_seconds: float
    device_used: str

class DashboardResponse(BaseModel):
    status: str = "success"
    message: Optional[str] = "Analisis sentimen berhasil diselesaikan"
    metadata: DashboardMetadata
    summary: SentimentSummary
    word_frequency: WordFrequencyBreakdown
    results: List[SentimentItem]

class SingleSentimentResponse(BaseModel):
    status: str = "success"
    result: SentimentItem

class SystemStatusResponse(BaseModel):
    status: str
    app_name: str
    model_loaded: bool
    model_path: str
    device: str
    labels: Dict[int, str]
