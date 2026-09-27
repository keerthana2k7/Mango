from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.prediction import PredictionOut, PredictionCreate
from app.services.prediction_service import prediction_service
from app.services.image_service import image_service

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.post("", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
def trigger_prediction(pred_in: PredictionCreate, db: Session = Depends(get_db)):
    image = image_service.get_by_id(db, pred_in.image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    prediction = prediction_service.run_prediction_for_image(db, image)
    return prediction

@router.get("/{prediction_id}", response_model=PredictionOut)
def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    prediction = prediction_service.get_by_id(db, prediction_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction

@router.get("/farm/{farm_id}", response_model=List[PredictionOut])
def get_farm_predictions(farm_id: int, limit: int = 50, db: Session = Depends(get_db)):
    return prediction_service.get_by_farm(db, farm_id, limit)
