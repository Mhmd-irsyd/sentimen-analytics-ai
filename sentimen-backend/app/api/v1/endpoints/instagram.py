import time
from fastapi import APIRouter, HTTPException
from app.schemas.request import InstagramScrapeRequest
from app.schemas.response import DashboardResponse
from app.services.instagram_service import instagram_service
from app.models.indo_bert import indo_bert_engine
from app.services.analytics_service import analytics_service
from app.core.logger import logger

router = APIRouter()

@router.post("", response_model=DashboardResponse, summary="Scrape & Analisis Komentar Instagram")
async def analyze_instagram_comments(payload: InstagramScrapeRequest):
    """
    Ambil komentar post / reel Instagram dan lakukan klasifikasi sentimen menggunakan IndoBERT.
    """
    start_time = time.time()
    try:
        comments_data, post_title = instagram_service.fetch_comments(
            url=payload.url,
            max_comments=payload.max_comments or 50
        )

        raw_texts = [c["raw_text"] for c in comments_data]
        predictions = indo_bert_engine.predict_batch(raw_texts)

        # Merge metadata
        for idx, pred in enumerate(predictions):
            pred["author"] = comments_data[idx].get("author")
            pred["likes"] = comments_data[idx].get("likes", 0)
            pred["published_at"] = comments_data[idx].get("published_at")

        return analytics_service.build_dashboard_response(
            predictions=predictions,
            source="instagram",
            source_title=post_title,
            source_url=payload.url,
            start_time=start_time,
            device_str=str(indo_bert_engine.device)
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in Instagram analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal mengambil/menganalisis komentar Instagram: {str(e)}")
