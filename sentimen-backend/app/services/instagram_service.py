import re
import time
import requests
from typing import List, Dict, Any, Tuple
from fastapi import HTTPException
from app.core.config import settings
from app.core.logger import logger

class InstagramService:
    def extract_shortcode(self, url: str) -> str:
        """Extract Instagram post shortcode (e.g. from /p/Dci4LBBmHKu/ or /reel/Dci4LBBmHKu/)"""
        pattern = r'/(?:p|reel|tv)/([A-Za-z0-9_-]+)'
        match = re.search(pattern, url)
        if match:
            return match.group(1)
        clean_url = url.strip().strip("/")
        if len(clean_url) < 30 and "/" not in clean_url:
            return clean_url
        return ""

    def _process_comment_node(self, c: Dict[str, Any], comments_data: List[Dict[str, Any]], seen_comment_ids: set, target_limit: int):
        """Helper to append comment node and its child replies to comments_data"""
        if len(comments_data) >= target_limit:
            return

        comment_id = str(c.get("pk") or c.get("id") or c.get("text"))
        text = c.get("text", "").strip()

        if text and comment_id not in seen_comment_ids:
            seen_comment_ids.add(comment_id)
            comments_data.append({
                "raw_text": text,
                "author": c.get("user", {}).get("username", "ig_user"),
                "likes": int(c.get("comment_like_count", 0)),
                "published_at": str(c.get("created_at_utc")) if c.get("created_at_utc") else None
            })

        # Also extract preview child replies
        child_replies = c.get("preview_child_comments") or c.get("child_comments") or []
        for child in child_replies:
            if len(comments_data) >= target_limit:
                break
            child_id = str(child.get("pk") or child.get("id") or child.get("text"))
            child_text = child.get("text", "").strip()
            if child_text and child_id not in seen_comment_ids:
                seen_comment_ids.add(child_id)
                comments_data.append({
                    "raw_text": child_text,
                    "author": child.get("user", {}).get("username", "ig_user"),
                    "likes": int(child.get("comment_like_count", 0)),
                    "published_at": str(child.get("created_at_utc")) if child.get("created_at_utc") else None
                })

    def fetch_comments(self, url: str, max_comments: int = 100) -> Tuple[List[Dict[str, Any]], str]:
        """
        Fetch real Instagram post comments via RapidAPI. Raises informative HTTP error if API quota is exceeded or fails.
        """
        shortcode = self.extract_shortcode(url)
        if not shortcode:
            raise HTTPException(status_code=400, detail="Format URL Instagram tidak valid. Pastikan format mengandung /p/ atau /reel/.")

        if not settings.RAPIDAPI_KEY:
            raise HTTPException(status_code=500, detail="RapidAPI Key belum dikonfigurasi pada file .env backend.")

        post_title = f"Instagram Post ({shortcode})"
        comments_data = []
        seen_comment_ids = set()

        headers = {
            "x-rapidapi-key": settings.RAPIDAPI_KEY,
            "x-rapidapi-host": settings.RAPIDAPI_HOST
        }
        
        logger.info(f"Fetching Instagram post details for shortcode: {shortcode} via RapidAPI")
        
        try:
            post_resp = requests.get(
                f"https://{settings.RAPIDAPI_HOST}/post",
                headers=headers,
                params={"shortcode": shortcode},
                timeout=15
            )
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Network error connecting to RapidAPI: {req_err}")
            raise HTTPException(status_code=503, detail="Gagal terhubung ke server RapidAPI Instagram. Periksa koneksi internet.")

        if post_resp.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Quota harian/bulanan RapidAPI Instagram telah habis (Error 429: Rate Limit Exceeded). Harap perbarui RapidAPI Key atau tunggu reset kuota."
            )
        elif post_resp.status_code != 200:
            err_detail = post_resp.json().get("message", post_resp.text) if post_resp.headers.get("content-type", "").startswith("application/json") else post_resp.text
            raise HTTPException(status_code=post_resp.status_code, detail=f"Gagal mengambil detail postingan IG ({post_resp.status_code}): {err_detail}")

        post_json = post_resp.json()
        media_id = post_json.get("id") or post_json.get("pk")
        owner_username = post_json.get("user", {}).get("username")
        
        if owner_username:
            post_title = f"Instagram Post (@{owner_username})"

        if not media_id:
            raise HTTPException(status_code=404, detail="Media ID postingan Instagram tidak ditemukan atau post bersifat private.")

        logger.info(f"Fetching comments for media ID {media_id} up to limit: {max_comments}...")
        next_min_id = None

        while len(comments_data) < max_comments:
            params = {"id": media_id}
            if next_min_id:
                params["next_min_id"] = next_min_id

            try:
                comm_resp = requests.get(
                    f"https://{settings.RAPIDAPI_HOST}/comments",
                    headers=headers,
                    params=params,
                    timeout=15
                )
            except requests.exceptions.RequestException as req_err:
                logger.warning(f"Pagination request interrupted: {req_err}.")
                break

            if comm_resp.status_code == 429:
                if len(comments_data) > 0:
                    logger.warning("RapidAPI Quota hit during pagination. Returning comments fetched so far.")
                    break
                else:
                    raise HTTPException(
                        status_code=429,
                        detail="Quota harian/bulanan RapidAPI Instagram telah habis (Error 429: Rate Limit Exceeded). Harap perbarui RapidAPI Key."
                    )
            elif comm_resp.status_code != 200:
                logger.warning(f"Comments endpoint returned status {comm_resp.status_code}. Stopping pagination.")
                break

            comm_json = comm_resp.json()
            raw_comments = comm_json.get("comments", [])
            if not raw_comments:
                break

            prev_count = len(comments_data)
            for c in raw_comments:
                self._process_comment_node(c, comments_data, seen_comment_ids, max_comments)

            if len(comments_data) == prev_count:
                logger.info("No new unique comments added in pagination batch. Stopping.")
                break

            next_min_id = comm_json.get("next_min_id")
            if not next_min_id:
                break

            time.sleep(0.2)

        if not comments_data:
            raise HTTPException(status_code=444, detail="Tidak ada komentar publik yang berhasil ditarik dari postingan Instagram ini.")

        logger.info(f"Total unique Instagram comments collected: {len(comments_data)}")
        return comments_data, post_title

instagram_service = InstagramService()
