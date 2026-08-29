import io
import pandas as pd
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile, HTTPException
from app.core.logger import logger

class FileService:
    # Common Indonesian and English comment/review column names
    CANDIDATE_COLUMNS = [
        "komentar", "review", "ulasan", "text", "content", "isi", 
        "comment", "komentar_bersih", "tweet", "deskripsi", "kalimat",
        "feedback", "pesan", "caption"
    ]

    async def parse_file(self, file: UploadFile, text_column: str = None) -> Tuple[List[Dict[str, Any]], str]:
        """
        Parse CSV or Excel file and extract raw comments with metadata (author, rating, likes, etc.)
        """
        contents = await file.read()
        filename = file.filename.lower()
        
        try:
            if filename.endswith(".csv"):
                # Try UTF-8 first, fallback to latin-1
                try:
                    df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
            elif filename.endswith((".xlsx", ".xls")):
                df = pd.read_excel(io.BytesIO(contents))
            else:
                raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx).")
        except Exception as e:
            logger.error(f"Error reading file {file.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Gagal membaca file: {str(e)}")

        if df.empty:
            raise HTTPException(status_code=400, detail="File yang diunggah kosong.")

        # Identify the text column
        selected_col = None
        if text_column and text_column in df.columns:
            selected_col = text_column
        else:
            # Auto-detect column
            cols_lower = {str(c).lower().strip(): c for c in df.columns}
            for candidate in self.CANDIDATE_COLUMNS:
                if candidate in cols_lower:
                    selected_col = cols_lower[candidate]
                    break

            # Fallback to the first string/object column if no candidate matched
            if not selected_col:
                for c in df.columns:
                    if df[c].dtype == "object":
                        selected_col = c
                        break

        if not selected_col:
            raise HTTPException(
                status_code=400, 
                detail=f"Tidak dapat mendeteksi kolom komentar otomatis. Kolom yang tersedia: {list(df.columns)}"
            )

        # Look for optional metadata columns
        author_col = None
        likes_col = None
        date_col = None
        cols_lower = {str(c).lower().strip(): c for c in df.columns}

        for c_low, orig_c in cols_lower.items():
            if any(k in c_low for k in ["username", "user", "author", "pengguna", "nama"]):
                author_col = orig_c
            elif any(k in c_low for k in ["like", "suka", "upvote"]):
                likes_col = orig_c
            elif any(k in c_low for k in ["date", "tanggal", "waktu", "created_at", "time"]):
                date_col = orig_c

        # Clean rows with NaN in text column
        df = df.dropna(subset=[selected_col])
        
        extracted_data = []
        for idx, row in df.iterrows():
            text_val = str(row[selected_col]).strip()
            if text_val:
                extracted_data.append({
                    "raw_text": text_val,
                    "author": str(row[author_col]) if author_col and pd.notna(row[author_col]) else f"User #{idx + 1}",
                    "likes": int(row[likes_col]) if likes_col and pd.notna(row[likes_col]) and str(row[likes_col]).isnumeric() else 0,
                    "published_at": str(row[date_col]) if date_col and pd.notna(row[date_col]) else None
                })

        return extracted_data, selected_col

file_service = FileService()
