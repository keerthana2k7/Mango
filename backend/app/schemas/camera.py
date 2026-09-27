from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.camera import CameraStatus

class CameraBase(BaseModel):
    name: str
    device_type: str = "SIMULATED_RAIL_CAM"
    status: CameraStatus = CameraStatus.ONLINE
    current_row: int = 1
    current_column: int = 1
    rail_position_meters: float = 0.0
    speed_m_per_s: float = 1.0
    battery_percentage: float = 95.0

class CameraCreate(CameraBase):
    farm_id: int

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[str] = None
    status: Optional[CameraStatus] = None
    current_row: Optional[int] = None
    current_column: Optional[int] = None
    rail_position_meters: Optional[float] = None
    speed_m_per_s: Optional[float] = None
    battery_percentage: Optional[float] = None

class CameraOut(CameraBase):
    id: int
    farm_id: int
    current_tree_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
