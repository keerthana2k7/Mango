from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class PredictionCreate(BaseModel):
    image_id: int
    tree_id: int

class PredictionOut(BaseModel):
    id: int
    image_id: int
    tree_id: int
    disease_name: str
    confidence: float
    class_id: int
    model_version: str
    is_mock: bool
    symptoms: Optional[str] = None
    treatment_recommendation: Optional[str] = None
    prediction_time: datetime

    model_config = ConfigDict(from_attributes=True)

class PredictionBatchResult(BaseModel):
    predictions: List[PredictionOut]
    total_processed: int
