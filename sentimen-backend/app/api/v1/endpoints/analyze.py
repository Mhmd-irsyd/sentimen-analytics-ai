import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.request import SingleTextRequest, BatchTextRequest
from app.schemas.response import DashboardResponse, SingleSentimentResponse, SentimentItem
from app.models.indo_bert import indo_bert_engine
from app.services.analytics_service import analytics_service
from app.services.file_service import file_service
from app.core.logger import logger

router = APIRouter()

@router.post("/text", response_model=SingleSentimentResponse, summary="Analisis Satu Teks/Kalimat")
async def analyze_single_text(payload: SingleTextRequest):
    """
    Analisis sentimen untuk satu kalimat teks / ulasan langsung.
    """
    try:
        res = indo_bert_engine.predict_single(payload.text)
        sentiment_item = SentimentItem(
            id=1,
            original_text=res["original_text"],
            cleaned_text=res["cleaned_text"],
            sentiment=res["sentiment"],
            confidence=res["confidence"],
            probabilities=res["probabilities"],
            author="User Playground",
            likes=0,
            published_at=None
        )
        return SingleSentimentResponse(
            status="success",
            result=sentiment_item
        )
    except Exception as e:
        logger.error(f"Error analyzing single text: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses teks: {str(e)}")

@router.post("/batch", response_model=DashboardResponse, summary="Analisis Batch Teks (Array)")
async def analyze_batch_texts(payload: BatchTextRequest):
    """
    Analisis sentimen untuk daftar teks dalam format JSON array.
    """
    start_time = time.time()
    try:
        raw_texts = [t for t in payload.texts if t.strip()]
        if not raw_texts:
            raise HTTPException(status_code=400, detail="Daftar teks tidak boleh kosong.")

        predictions = indo_bert_engine.predict_batch(raw_texts)
        
        return analytics_service.build_dashboard_response(
            predictions=predictions,
            source="batch",
            source_title=f"Batch Input ({len(raw_texts)} Komentar)",
            start_time=start_time,
            device_str=str(indo_bert_engine.device)
        )
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses batch: {str(e)}")

@router.post("/file", response_model=DashboardResponse, summary="Analisis File Dataset (CSV/Excel)")
async def analyze_file_upload(
    file: UploadFile = File(...),
    column_name: Optional[str] = Form(None)
):
    """
    Upload file CSV atau XLSX untuk diekstraksi komentar dan dianalisis sentimennya secara otomatis.
    """
    start_time = time.time()
    try:
        extracted_data, detected_col = await file_service.parse_file(file, text_column=column_name)
        raw_texts = [item["raw_text"] for item in extracted_data]
        
        predictions = indo_bert_engine.predict_batch(raw_texts)
        
        # Merge metadata (author, likes, published_at) back into prediction results
        for idx, pred in enumerate(predictions):
            pred["author"] = extracted_data[idx].get("author")
            pred["likes"] = extracted_data[idx].get("likes", 0)
            pred["published_at"] = extracted_data[idx].get("published_at")

        return analytics_service.build_dashboard_response(
            predictions=predictions,
            source="file",
            source_title=f"{file.filename} (Kolom: '{detected_col}')",
            start_time=start_time,
            device_str=str(indo_bert_engine.device)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in file analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis file: {str(e)}")
