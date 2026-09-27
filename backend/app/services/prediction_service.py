import os
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.models.image import Image, ProcessingStatus
from app.models.tree import Tree, TreeHealthStatus
from app.ml.inference import inference_engine
from app.services.storage_service import storage_service

class PredictionService:
    @staticmethod
    def run_prediction_for_image(db: Session, image: Image) -> Prediction:
        # Resolve image file
        abs_path = storage_service.get_absolute_path(image.file_path)
        image_bytes = b""
        if os.path.exists(abs_path):
            with open(abs_path, "rb") as f:
                image_bytes = f.read()

        # Run ML inference
        diag = inference_engine.predict(image_bytes, filename=os.path.basename(image.file_path))

        # Create or update prediction record
        prediction = db.query(Prediction).filter(Prediction.image_id == image.id).first()
        if not prediction:
            prediction = Prediction(
                image_id=image.id,
                tree_id=image.tree_id,
                disease_name=diag["disease_name"],
                confidence=diag["confidence"],
                class_id=diag["class_id"],
                model_version=diag["model_version"],
                is_mock=diag["is_mock"],
                symptoms=diag.get("symptoms"),
                treatment_recommendation=diag.get("treatment_recommendation"),
                prediction_time=datetime.now(timezone.utc)
            )
            db.add(prediction)
        else:
            prediction.disease_name = diag["disease_name"]
            prediction.confidence = diag["confidence"]
            prediction.class_id = diag["class_id"]
            prediction.model_version = diag["model_version"]
            prediction.is_mock = diag["is_mock"]
            prediction.symptoms = diag.get("symptoms")
            prediction.treatment_recommendation = diag.get("treatment_recommendation")
            prediction.prediction_time = datetime.now(timezone.utc)

        # Update Image processing status
        image.processing_status = ProcessingStatus.PROCESSED

        # Update Tree health status
        tree = db.query(Tree).filter(Tree.id == image.tree_id).first()
        if tree:
            if diag["disease_name"].lower() == "healthy":
                tree.health_status = TreeHealthStatus.HEALTHY
            else:
                tree.health_status = TreeHealthStatus.DISEASE_DETECTED
            tree.last_inspected_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(prediction)
        return prediction

    @staticmethod
    def get_by_id(db: Session, prediction_id: int) -> Optional[Prediction]:
        return db.query(Prediction).filter(Prediction.id == prediction_id).first()

    @staticmethod
    def get_by_tree(db: Session, tree_id: int) -> List[Prediction]:
        return db.query(Prediction).filter(Prediction.tree_id == tree_id).order_by(Prediction.prediction_time.desc()).all()

    @staticmethod
    def get_by_farm(db: Session, farm_id: int, limit: int = 50) -> List[Prediction]:
        return db.query(Prediction).join(Tree).filter(Tree.farm_id == farm_id).order_by(Prediction.prediction_time.desc()).limit(limit).all()

prediction_service = PredictionService()
