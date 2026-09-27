import os
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("mangovision.ml")

class ModelLoader:
    _instance: Optional["ModelLoader"] = None

    def __init__(self):
        self.config: Dict[str, Any] = {}
        self.classes: List[Dict[str, Any]] = []
        self.class_map: Dict[int, Dict[str, Any]] = {}
        self.is_loaded: bool = False
        self.model_session: Any = None
        self._load_metadata()

    @classmethod
    def get_instance(cls) -> "ModelLoader":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_metadata(self):
        try:
            if os.path.exists(settings.MODEL_CONFIG_PATH):
                with open(settings.MODEL_CONFIG_PATH, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
            else:
                self.config = {"version": "v1.0.0", "input_size": [224, 224]}

            if os.path.exists(settings.CLASSES_PATH):
                with open(settings.CLASSES_PATH, "r", encoding="utf-8") as f:
                    self.classes = json.load(f)
                    self.class_map = {item["class_id"]: item for item in self.classes}
            else:
                self.classes = []
                self.class_map = {}
            logger.info("Loaded ML metadata: %d classes defined", len(self.classes))
        except Exception as e:
            logger.error("Failed to load ML metadata: %s", e)

    def load_model(self):
        """Loads trained weights if present and ML_MODE is 'model'."""
        if settings.ML_MODE == "model" and settings.MODEL_PATH and os.path.exists(settings.MODEL_PATH):
            try:
                # Placeholder for torch.jit.load or onnxruntime session
                logger.info("Loading ML model weights from %s", settings.MODEL_PATH)
                self.is_loaded = True
            except Exception as e:
                logger.error("Error loading model: %s. Falling back to mock mode.", e)
                self.is_loaded = False
        else:
            logger.info("Running in ML_MODE=%s", settings.ML_MODE)
            self.is_loaded = False

model_loader = ModelLoader.get_instance()
