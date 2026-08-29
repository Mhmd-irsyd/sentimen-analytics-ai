from fastapi import APIRouter
from app.api.v1.endpoints import analyze, youtube, instagram, system

api_router = APIRouter()

api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(analyze.router, prefix="/analyze", tags=["Analyze"])
api_router.include_router(youtube.router, prefix="/youtube", tags=["YouTube"])
api_router.include_router(instagram.router, prefix="/instagram", tags=["Instagram"])
