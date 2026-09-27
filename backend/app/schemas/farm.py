from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class FarmBase(BaseModel):
    name: str
    location: str
    area_acres: float = 1.0
    total_rows: int = 4
    trees_per_row: int = 6
    description: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    area_acres: Optional[float] = None
    total_rows: Optional[int] = None
    trees_per_row: Optional[int] = None
    description: Optional[str] = None

class FarmOut(FarmBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_trees: Optional[int] = 0
    healthy_trees: Optional[int] = 0
    diseased_trees: Optional[int] = 0
    unknown_trees: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class FarmBoundaryPoint(BaseModel):
    x: float
    y: float

class FarmDimensions(BaseModel):
    width_meters: float
    height_meters: float

class LayoutTree(BaseModel):
    tree_id: int
    tree_number: str
    row: int
    column: int
    x: float
    y: float
    health_status: str
    variety: str
    latest_disease: Optional[str] = None
    latest_confidence: Optional[float] = None

class LayoutRow(BaseModel):
    row_number: int
    rail_y: float
    start_x: float
    end_x: float
    trees: list[LayoutTree]

class CameraPathPoint(BaseModel):
    sequence: int
    x: float
    y: float
    row: int
    checkpoint_tree_id: Optional[int] = None

class CameraPath(BaseModel):
    path_id: int
    name: str
    total_length_meters: float
    points: list[CameraPathPoint]

class FarmLayoutResponse(BaseModel):
    farm_id: int
    name: str
    location: str
    dimensions: FarmDimensions
    boundary: list[FarmBoundaryPoint]
    rows: list[LayoutRow]
    camera_paths: list[CameraPath]

