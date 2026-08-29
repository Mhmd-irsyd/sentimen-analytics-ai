import time
from typing import List, Dict, Any
from app.models.preprocessor import preprocessor
from app.schemas.response import (
    DashboardResponse,
    DashboardMetadata,
    SentimentSummary,
    WordFrequencyBreakdown,
    SentimentItem,
    KeywordFrequencyItem
)

class AnalyticsService:
    def build_dashboard_response(
        self,
        predictions: List[Dict[str, Any]],
        source: str,
        source_title: str = "Dataset Analysis",
        source_url: str = None,
        start_time: float = None,
        device_str: str = "cpu"
    ) -> DashboardResponse:
        total = len(predictions)
        if total == 0:
            return DashboardResponse(
                status="success",
                message="Tidak ada data komentar untuk dianalisis",
                metadata=DashboardMetadata(
                    source=source,
                    source_title=source_title,
                    source_url=source_url,
                    processed_count=0,
                    processing_time_seconds=0.0,
                    device_used=device_str
                ),
                summary=SentimentSummary(
                    total_comments=0,
                    positive_count=0,
                    neutral_count=0,
                    negative_count=0,
                    positive_percentage=0.0,
                    neutral_percentage=0.0,
                    negative_percentage=0.0,
                    dominant_sentiment="Netral",
                    net_sentiment_score=0.0,
                    average_confidence=0.0
                ),
                word_frequency=WordFrequencyBreakdown(
                    top_overall=[],
                    top_positive=[],
                    top_neutral=[],
                    top_negative=[]
                ),
                results=[]
            )

        pos_count = 0
        neu_count = 0
        neg_count = 0
        total_conf = 0.0

        pos_texts = []
        neu_texts = []
        neg_texts = []
        all_texts = []

        sentiment_items: List[SentimentItem] = []

        for idx, item in enumerate(predictions):
            sent = item.get("sentiment", "Netral")
            conf = item.get("confidence", 0.0)
            orig = item.get("original_text", "")
            
            total_conf += conf
            all_texts.append(orig)

            if sent == "Positif":
                pos_count += 1
                pos_texts.append(orig)
            elif sent == "Negatif":
                neg_count += 1
                neg_texts.append(orig)
            else:
                neu_count += 1
                neu_texts.append(orig)

            sentiment_items.append(
                SentimentItem(
                    id=idx + 1,
                    original_text=orig,
                    cleaned_text=item.get("cleaned_text", ""),
                    sentiment=sent,
                    confidence=conf,
                    probabilities=item.get("probabilities", {}),
                    author=item.get("author", f"User #{idx + 1}"),
                    likes=item.get("likes", 0),
                    published_at=item.get("published_at")
                )
            )

        pos_pct = round((pos_count / total) * 100, 2)
        neu_pct = round((neu_count / total) * 100, 2)
        neg_pct = round((neg_count / total) * 100, 2)
        
        # Dominant sentiment
        counts = {"Positif": pos_count, "Netral": neu_count, "Negatif": neg_count}
        dominant = max(counts.items(), key=lambda x: x[1])[0]
        
        # Net Sentiment Score = % Positif - % Negatif (range -100 to +100)
        net_score = round(pos_pct - neg_pct, 2)
        avg_conf = round(total_conf / total, 4)

        # Keyword frequency extraction
        top_overall = [KeywordFrequencyItem(**kw) for kw in preprocessor.extract_keywords(all_texts, top_n=25)]
        top_pos = [KeywordFrequencyItem(**kw) for kw in preprocessor.extract_keywords(pos_texts, top_n=20)]
        top_neu = [KeywordFrequencyItem(**kw) for kw in preprocessor.extract_keywords(neu_texts, top_n=15)]
        top_neg = [KeywordFrequencyItem(**kw) for kw in preprocessor.extract_keywords(neg_texts, top_n=20)]

        elapsed_time = round(time.time() - start_time, 3) if start_time else 0.0

        return DashboardResponse(
            status="success",
            metadata=DashboardMetadata(
                source=source,
                source_title=source_title,
                source_url=source_url,
                processed_count=total,
                processing_time_seconds=elapsed_time,
                device_used=device_str
            ),
            summary=SentimentSummary(
                total_comments=total,
                positive_count=pos_count,
                neutral_count=neu_count,
                negative_count=neg_count,
                positive_percentage=pos_pct,
                neutral_percentage=neu_pct,
                negative_percentage=neg_pct,
                dominant_sentiment=dominant,
                net_sentiment_score=net_score,
                average_confidence=avg_conf
            ),
            word_frequency=WordFrequencyBreakdown(
                top_overall=top_overall,
                top_positive=top_pos,
                top_neutral=top_neu,
                top_negative=top_neg
            ),
            results=sentiment_items
        )

analytics_service = AnalyticsService()
