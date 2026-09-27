from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.image import ProcessingStatus

class ImageBase(BaseModel):
    farm_id: int
    tree_id: int
    camera_id: Optional[int] = None
    image_type: str = "RGB_LEAF"

class ImageOut(ImageBase):
    id: int
    file_path: str
    thumbnail_path: Optional[str] = None
    capture_time: datetime
    processing_status: ProcessingStatus
    created_at: datetime
    prediction: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
