from pydantic import BaseModel, Field
from typing import List, Optional

class SingleTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Komentar atau teks yang akan dianalisis")

class BatchTextRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=10000, description="Daftar teks atau komentar")

class YouTubeScrapeRequest(BaseModel):
    url: str = Field(..., description="URL video YouTube (cth: https://www.youtube.com/watch?v=... atau https://youtu.be/...)")
    max_comments: Optional[int] = Field(default=100, ge=10, le=1000, description="Maksimal jumlah komentar yang diambil")

class InstagramScrapeRequest(BaseModel):
    url: str = Field(..., description="URL post Instagram atau Reel")
    max_comments: Optional[int] = Field(default=100, ge=10, le=500, description="Maksimal jumlah komentar")
