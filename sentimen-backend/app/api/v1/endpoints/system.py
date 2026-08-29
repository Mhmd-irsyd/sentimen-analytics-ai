from fastapi import APIRouter
from app.core.config import settings
from app.models.indo_bert import indo_bert_engine
from app.schemas.response import SystemStatusResponse

router = APIRouter()

@router.get("/health", response_model=SystemStatusResponse, summary="System Health & Model Status")
async def health_check():
    """
    Cek status kesehatan API dan status ketersediaan model IndoBERT.
    """
    return SystemStatusResponse(
        status="healthy",
        app_name=settings.PROJECT_NAME,
        model_loaded=indo_bert_engine.is_loaded(),
        model_path=settings.MODEL_PATH,
        device=str(indo_bert_engine.device),
        labels=indo_bert_engine.label_mapping
    )

@router.get("/info", summary="Model Info & Hardware Specs")
async def get_model_info():
    """
    Informasi mendalam tentang konfigurasi model IndoBERT dan spesifikasi inferensi.
    """
    return {
        "model_architecture": "IndoBERT (BertForSequenceClassification)",
        "supported_classes": list(indo_bert_engine.label_mapping.values()),
        "label_mapping": indo_bert_engine.label_mapping,
        "device": str(indo_bert_engine.device),
        "batch_size": settings.BATCH_SIZE,
        "is_model_ready": indo_bert_engine.is_loaded(),
        "model_location": settings.MODEL_PATH
    }
