from typing import List, Dict, Any
from pydantic import BaseModel

class DiseaseCountItem(BaseModel):
    disease_name: str
    count: int
    percentage: float
    severity: str  # "HIGH", "MEDIUM", "LOW", "NONE"

class HealthDistribution(BaseModel):
    healthy_count: int
    healthy_percentage: float
    diseased_count: int
    diseased_percentage: float
    unknown_count: int
    unknown_percentage: float

class FarmAnalyticsSummary(BaseModel):
    farm_id: int
    farm_name: str
    total_trees: int
    health_score: float  # e.g. 87.5%
    health_distribution: HealthDistribution
    disease_breakdown: List[DiseaseCountItem]
    active_cameras: int
    total_images_captured: int
    total_predictions_made: int
    recent_activity: List[Dict[str, Any]]
