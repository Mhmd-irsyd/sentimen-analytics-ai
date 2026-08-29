import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.models.indo_bert import indo_bert_engine
from app.models.preprocessor import preprocessor
from app.services.analytics_service import analytics_service


def test_inference_pipeline():
    print("--- 1. Testing Indonesian Text Preprocessor ---")
    raw_sample = "Barang baguuusss bgt kak!! 😍 Pengiriman cepet bgt, seller fast respon @olshop_id #mantap"
    cleaned = preprocessor.clean_text(raw_sample)
    print(f"Original: {raw_sample}")
    print(f"Cleaned : {cleaned}")
    assert len(cleaned) > 0, "Preprocessing returned empty string"

    print("\n--- 2. Testing IndoBERT Model Loading & Inference ---")
    indo_bert_engine.load_model()
    assert indo_bert_engine.is_loaded(), "Model failed to load"
    print(f"Device: {indo_bert_engine.device}")
    print(f"Label Mapping: {indo_bert_engine.label_mapping}")

    test_sentences = [
        "Produk sangat bagus, kualitas original, pengiriman sangat cepat dan saya puas banget!",
        "Barang sudah diterima sesuai pesanan, standar dan biasa saja.",
        "Sangat kecewa! Barangnya rusak pecah dan sellernya tidak mau tanggung jawab, kapok!"
    ]

    predictions = indo_bert_engine.predict_batch(test_sentences)
    for p in predictions:
        print(f"\nText: {p['original_text']}")
        print(f"Sentiment: {p['sentiment']} (Confidence: {p['confidence']})")
        print(f"Probabilities: {p['probabilities']}")

    print("\n--- 3. Testing Analytics Summary Service ---")
    dashboard = analytics_service.build_dashboard_response(
        predictions=predictions,
        source="test",
        source_title="Unit Test Sample"
    )
    print(f"Total comments: {dashboard.summary.total_comments}")
    print(f"Positive: {dashboard.summary.positive_percentage}% ({dashboard.summary.positive_count})")
    print(f"Neutral : {dashboard.summary.neutral_percentage}% ({dashboard.summary.neutral_count})")
    print(f"Negative: {dashboard.summary.negative_percentage}% ({dashboard.summary.negative_count})")
    print(f"Net Sentiment Score: {dashboard.summary.net_sentiment_score}")
    print(f"Top Keywords: {[kw.word for kw in dashboard.word_frequency.top_overall[:5]]}")

    print("\n[SUCCESS] ALL INFERENCE & PIPELINE TESTS PASSED!")

if __name__ == "__main__":
    test_inference_pipeline()
