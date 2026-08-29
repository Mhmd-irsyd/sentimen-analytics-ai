import re
from itertools import islice
from typing import List, Dict, Any, Tuple
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_POPULAR
import yt_dlp
from app.core.logger import logger

class YouTubeService:
    def __init__(self):
        self.downloader = YoutubeCommentDownloader()

    def extract_video_id(self, url: str) -> str:
        """Extract YouTube video ID from various URL formats"""
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
            r'(?:embed\/)([0-9A-Za-z_-]{11})',
            r'(?:shorts\/)([0-9A-Za-z_-]{11})'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return ""

    def get_video_title(self, url: str) -> str:
        """Fetch video title using yt-dlp metadata extractor"""
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return info.get('title', 'YouTube Video')
        except Exception as e:
            logger.warning(f"Could not extract video title: {e}")
            return "YouTube Video"

    def fetch_comments(self, url: str, max_comments: int = 100) -> Tuple[List[Dict[str, Any]], str]:
        """
        Fetch YouTube comments for given URL up to max_comments
        """
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError("Format URL YouTube tidak valid. Pastikan link berisi ID video.")

        video_title = self.get_video_title(url)
        logger.info(f"Fetching up to {max_comments} comments for YouTube video: {video_id} ({video_title})")

        comments_data = []
        try:
            comments_generator = self.downloader.get_comments_from_url(url, sort_by=SORT_BY_POPULAR)
            for comment in islice(comments_generator, max_comments):
                raw_text = comment.get('text', '').strip()
                if raw_text:
                    comments_data.append({
                        "raw_text": raw_text,
                        "author": comment.get('author', 'YouTube User'),
                        "likes": int(comment.get('votes', 0)) if str(comment.get('votes', 0)).isdigit() else 0,
                        "published_at": comment.get('time', None)
                    })
        except Exception as e:
            logger.error(f"Error fetching YouTube comments: {e}")
            raise RuntimeError(f"Gagal mengambil komentar YouTube: {str(e)}")

        if not comments_data:
            raise RuntimeError("Tidak ada komentar publik yang ditemukan pada video YouTube ini.")

        return comments_data, video_title

youtube_service = YouTubeService()
