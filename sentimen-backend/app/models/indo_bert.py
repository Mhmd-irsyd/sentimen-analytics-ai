import os
import torch
from typing import List, Dict, Any, Tuple
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from app.core.config import settings
from app.core.logger import logger
from app.models.preprocessor import preprocessor
from app.models.heuristic import post_process_sentiment

class IndoBERTInferenceEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(IndoBERTInferenceEngine, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
        
        self.device = self._get_device()
        self.model_path = settings.MODEL_PATH
        self.tokenizer = None
        self.model = None
        self.label_mapping = {0: "Positif", 1: "Netral", 2: "Negatif"}
        self.initialized = True

    def _get_device(self) -> torch.device:
        if settings.DEVICE.lower() == "cuda" and torch.cuda.is_available():
            return torch.device("cuda")
        elif settings.DEVICE.lower() == "cpu":
            return torch.device("cpu")
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def load_model(self):
        """Load tokenizer and model from local path"""
        try:
            logger.info(f"Loading IndoBERT model from: {self.model_path} onto {self.device}")
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model path does not exist: {self.model_path}")

            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
            self.model.to(self.device)
            self.model.eval()
            
            # Calibrate or verify label mapping based on model config or test validation
            self._calibrate_labels()
            
            logger.info(f"IndoBERT model successfully loaded on {self.device} with label mapping: {self.label_mapping}")
        except Exception as e:
            logger.error(f"Failed to load IndoBERT model: {str(e)}")
            raise e

    def _calibrate_labels(self):
        """
        Calibrate label indices (Positif, Netral, Negatif) by checking config or running validation probe.
        """
        # If config already has explicit sentiment names, use them
        config_id2label = getattr(self.model.config, "id2label", {})
        sample_val = str(config_id2label.get(0, "")).lower()
        if "pos" in sample_val or "neg" in sample_val or "net" in sample_val:
            mapped = {}
            for k, v in config_id2label.items():
                idx = int(k)
                v_str = str(v).lower()
                if "pos" in v_str:
                    mapped[idx] = "Positif"
                elif "neg" in v_str:
                    mapped[idx] = "Negatif"
                else:
                    mapped[idx] = "Netral"
            if len(mapped) == 3:
                self.label_mapping = mapped
                return

        # Probe model with distinct benchmark sentences to verify label orientation
        try:
            test_pos = "Barang ini sangat bagus, saya sangat puas, kualitas terbaik dan recommended sekali!"
            test_neg = "Sangat jelek, rusak parah, barang pecah dan saya sangat kecewa rugi beli ini!"
            
            inputs_pos = self.tokenizer(test_pos, return_tensors="pt", truncation=True, max_length=128).to(self.device)
            inputs_neg = self.tokenizer(test_neg, return_tensors="pt", truncation=True, max_length=128).to(self.device)
            
            with torch.no_grad():
                pred_pos = torch.argmax(self.model(**inputs_pos).logits, dim=-1).item()
                pred_neg = torch.argmax(self.model(**inputs_neg).logits, dim=-1).item()
            
            # All 3 labels: {0, 1, 2}
            all_indices = {0, 1, 2}
            neutral_idx = list(all_indices - {pred_pos, pred_neg})[0] if len({pred_pos, pred_neg}) == 2 else 1
            
            self.label_mapping = {
                pred_pos: "Positif",
                neutral_idx: "Netral",
                pred_neg: "Negatif"
            }
        except Exception as err:
            logger.warning(f"Label probe fallback to default: {err}")
            self.label_mapping = {0: "Positif", 1: "Netral", 2: "Negatif"}

    def is_loaded(self) -> bool:
        return self.model is not None and self.tokenizer is not None

    def predict_batch(self, raw_texts: List[str], batch_size: int = None) -> List[Dict[str, Any]]:
        """
        Batch inference on raw Indonesian texts with cleaning and probability computation.
        """
        if not self.is_loaded():
            self.load_model()

        if batch_size is None:
            batch_size = settings.BATCH_SIZE

        results = []
        cleaned_texts = [preprocessor.clean_text(t) for t in raw_texts]

        for i in range(0, len(raw_texts), batch_size):
            batch_raw = raw_texts[i : i + batch_size]
            batch_cleaned = cleaned_texts[i : i + batch_size]
            
            # Fallback for empty strings after cleaning
            inference_input = [c if c.strip() else "netral" for c in batch_cleaned]

            inputs = self.tokenizer(
                inference_input,
                padding=True,
                truncation=True,
                max_length=128,
                return_tensors="pt"
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                probabilities = torch.softmax(outputs.logits, dim=-1).cpu().numpy()

            for j, probs in enumerate(probabilities):
                # Map probabilities to labels
                prob_dict = {
                    self.label_mapping[idx]: float(probs[idx])
                    for idx in range(len(probs))
                    if idx in self.label_mapping
                }
                
                # Determine highest probability label from model
                best_label = max(prob_dict.items(), key=lambda x: x[1])[0]
                best_score = prob_dict[best_label]

                # --- Heuristic Post-Processing: 3-rule correction pipeline ---
                corrected_label, corrected_conf = post_process_sentiment(
                    teks_asli=batch_raw[j],
                    label_mentah=best_label,
                    confidence_mentah=best_score,
                    prob_positif=prob_dict.get("Positif", 0.0),
                    prob_netral=prob_dict.get("Netral", 0.0),
                )
                is_corrected = corrected_label != best_label

                results.append({
                    "original_text": batch_raw[j],
                    "cleaned_text": batch_cleaned[j],
                    "sentiment": corrected_label,
                    "confidence": round(float(corrected_conf), 4),
                    "probabilities": {k: round(v, 4) for k, v in prob_dict.items()},
                    "heuristic_corrected": is_corrected,
                })

        return results

    def predict_single(self, text: str) -> Dict[str, Any]:
        results = self.predict_batch([text], batch_size=1)
        return results[0]

indo_bert_engine = IndoBERTInferenceEngine()
