from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.tree import TreeHealthStatus

class TreeBase(BaseModel):
    tree_number: str
    row_number: int
    column_number: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    variety: str = "Alphonso / Banganapalli"
    health_status: TreeHealthStatus = TreeHealthStatus.UNKNOWN

class TreeCreate(TreeBase):
    farm_id: int

class TreeUpdate(BaseModel):
    tree_number: Optional[str] = None
    row_number: Optional[int] = None
    column_number: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    variety: Optional[str] = None
    health_status: Optional[TreeHealthStatus] = None
    last_inspected_at: Optional[datetime] = None

class LatestPredictionSummary(BaseModel):
    id: int
    disease_name: str
    confidence: float
    is_mock: bool
    prediction_time: datetime

    model_config = ConfigDict(from_attributes=True)

class TreeOut(TreeBase):
    id: int
    farm_id: int
    last_inspected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    latest_prediction: Optional[LatestPredictionSummary] = None

    model_config = ConfigDict(from_attributes=True)
