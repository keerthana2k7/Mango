from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.camera import CameraStatus
from app.models.tree import TreeHealthStatus

class SimulationControlCommand(BaseModel):
    action: str  # "START", "PAUSE", "STOP", "RESET", "STEP"
    speed: Optional[float] = None
    target_row: Optional[int] = None

class SimulationStatusResponse(BaseModel):
    camera_id: int
    farm_id: int
    status: CameraStatus
    x: float
    y: float
    z: float = 5.5
    current_row: int
    current_column: int

    direction: str = "FORWARD"  # "FORWARD" or "BACKWARD"
    current_tree_id: Optional[int] = None
    current_tree_number: Optional[str] = None
    current_tree_health: Optional[TreeHealthStatus] = None
    rail_position_meters: float
    total_rail_length_meters: float
    progress_percentage: float
    speed_m_per_s: float
    is_capturing: bool = False
    last_event: Optional[str] = None
    last_captured_image_id: Optional[int] = None
    last_prediction: Optional[Dict[str, Any]] = None
    updated_at: datetime

class SimulateDiseaseRequest(BaseModel):
    disease_name: str = "Anthracnose"
    tree_id: Optional[int] = None
    severity: str = "HIGH"
    operator_notes: Optional[str] = "Automated high-precision foliar simulation"

class SimulateDiseaseResponse(BaseModel):
    camera_id: int
    farm_id: int
    tree_id: int
    tree_number: str
    tree_health_status: str
    disease_name: str
    scientific_name: Optional[str] = None
    confidence: float
    severity: str
    symptoms: Optional[str] = None
    treatment_recommendation: Optional[str] = None
    image_id: int
    image_url: str
    alert_id: Optional[int] = None
    alert_severity: Optional[str] = None
    simulation_status: SimulationStatusResponse

