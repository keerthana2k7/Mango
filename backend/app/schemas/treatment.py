from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.treatment import TreatmentType

class TreatmentCreate(BaseModel):
    tree_id: int
    chemical_name: str
    dosage: Optional[str] = None
    operator_name: Optional[str] = "Farm Operator"
    treatment_type: TreatmentType = TreatmentType.CHEMICAL
    notes: Optional[str] = None
    update_tree_health: bool = True  # If true, transitions tree health to TREATED or HEALTHY
    new_health_status: Optional[str] = "TREATED"

class TreatmentResponse(BaseModel):
    id: int
    farm_id: int
    tree_id: int
    chemical_name: str
    dosage: Optional[str] = None
    operator_name: str
    treatment_type: TreatmentType
    notes: Optional[str] = None
    treated_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchTreatmentCreate(BaseModel):
    farm_id: int
    chemical_name: str
    dosage: Optional[str] = "3.0 g / Litre"
    operator_name: Optional[str] = "Orchard Automation"
    treatment_type: TreatmentType = TreatmentType.CHEMICAL
    notes: Optional[str] = "Farm-wide remedial protective spray for all detected foliar pathogens"
    target_health_status: Optional[str] = "DISEASE_DETECTED"

class BatchTreatmentResponse(BaseModel):
    farm_id: int
    treated_count: int
    chemical_name: str
    tree_numbers: list[str]
    message: str

