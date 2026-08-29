import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentimen Analytics AI"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True
    
    # Path to IndoBERT fine-tuned model
    MODEL_PATH: str = r"C:\Users\irsya\Downloads\model_sentimen\model_sentimen_terbaik"
    DEVICE: str = "auto"  # 'auto', 'cuda', 'cpu'
    BATCH_SIZE: int = 32
    
    # RapidAPI Instagram Scraper
    RAPIDAPI_KEY: str = "f525612013msh332bd9333071768p129595jsn5d3f8ab9a9ac"
    RAPIDAPI_HOST: str = "instagram-best-experience.p.rapidapi.com"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    @field_validator("CORS_ORIGINS", mode="after")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
