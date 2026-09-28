from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.alert import AlertSeverity, AlertType

class AlertCreate(BaseModel):
    farm_id: int
    tree_id: Optional[int] = None
    camera_id: Optional[int] = None
    alert_type: AlertType = AlertType.DISEASE_DETECTED
    severity: AlertSeverity = AlertSeverity.HIGH
    title: str
    message: str

class AlertResponse(BaseModel):
    id: int
    farm_id: int
    tree_id: Optional[int] = None
    camera_id: Optional[int] = None
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    is_acknowledged: bool
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
