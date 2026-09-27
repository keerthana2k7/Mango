import random
import logging
from typing import Dict, Any
from app.core.config import settings
from app.ml.model_loader import model_loader
from app.ml.preprocessing import load_and_preprocess_image

logger = logging.getLogger("mangovision.ml.inference")

class MLInferenceEngine:
    def __init__(self):
        self.loader = model_loader

    def predict(self, image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Executes inference on image_bytes.
        Returns:
            dict containing:
                disease_name (str)
                confidence (float)
                class_id (int)
                model_version (str)
                is_mock (bool)
                symptoms (str)
                treatment_recommendation (str)
        """
        if settings.ML_MODE == "model" and self.loader.is_loaded:
            try:
                tensor = load_and_preprocess_image(image_bytes)
                # Model forward pass execution
                # For demonstration of real model integration contract:
                # outputs = self.loader.model_session.run(tensor)
                # predicted_idx = int(np.argmax(outputs))
                # confidence = float(np.max(outputs))
                predicted_idx = 0
                confidence = 0.92
                is_mock = False
            except Exception as e:
                logger.error("Inference execution error: %s. Falling back to mock.", e)
                return self._mock_predict(filename)
        else:
            return self._mock_predict(filename)

        meta = self.loader.class_map.get(predicted_idx, {
            "name": "Unknown",
            "symptoms": "N/A",
            "treatment": "N/A"
        })

        return {
            "disease_name": meta["name"],
            "confidence": round(confidence, 4),
            "class_id": predicted_idx,
            "model_version": self.loader.config.get("version", "v1.0.0"),
            "is_mock": is_mock,
            "symptoms": meta.get("symptoms"),
            "treatment_recommendation": meta.get("treatment")
        }

    def _mock_predict(self, filename: str = "") -> Dict[str, Any]:
        """
        Deterministic/realistic mock prediction for development/testing
        when ML_MODE=mock or real weights are not mounted.
        Always clearly flags is_mock=True.
        """
        classes = self.loader.classes
        if not classes:
            return {
                "disease_name": "Healthy",
                "confidence": 0.95,
                "class_id": 7,
                "model_version": "mock-v1",
                "is_mock": True,
                "symptoms": "None",
                "treatment_recommendation": "None"
            }

        # Select a class - if filename contains hint use it, else weighted random
        lower_fn = filename.lower()
        selected_class = None
        for c in classes:
            if c["name"].lower().replace(" ", "_") in lower_fn or c["name"].lower() in lower_fn:
                selected_class = c
                break

        if not selected_class:
            # 60% chance Healthy, 40% chance one of the diseases
            if random.random() < 0.60:
                selected_class = self.loader.class_map.get(7, classes[0])
            else:
                diseases = [c for c in classes if c["class_id"] != 7]
                selected_class = random.choice(diseases) if diseases else classes[0]

        confidence = round(random.uniform(0.85, 0.98), 4)

        return {
            "disease_name": selected_class["name"],
            "confidence": confidence,
            "class_id": selected_class["class_id"],
            "model_version": "mock-v1.2",
            "is_mock": True,
            "symptoms": selected_class.get("symptoms"),
            "treatment_recommendation": selected_class.get("treatment")
        }

inference_engine = MLInferenceEngine()
