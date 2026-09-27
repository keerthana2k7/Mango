from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.image import ImageOut
from app.services.image_service import image_service
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/images", tags=["Images"])

@router.post("/upload", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
async def upload_image(
    farm_id: int = Form(...),
    tree_id: int = Form(...),
    camera_id: Optional[int] = Form(None),
    image_type: str = Form("RGB_LEAF"),
    auto_predict: bool = Form(True),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_bytes = await file.read()
    image = await image_service.upload_and_create(
        db=db,
        farm_id=farm_id,
        tree_id=tree_id,
        file_bytes=file_bytes,
        filename=file.filename or "leaf.jpg",
        camera_id=camera_id,
        image_type=image_type
    )

    if auto_predict:
        prediction_service.run_prediction_for_image(db, image)
        db.refresh(image)

    return image

@router.get("/{image_id}", response_model=ImageOut)
def get_image(image_id: int, db: Session = Depends(get_db)):
    image = image_service.get_by_id(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@router.get("/farm/{farm_id}", response_model=List[ImageOut])
def get_farm_images(farm_id: int, limit: int = 50, db: Session = Depends(get_db)):
    return image_service.get_by_farm(db, farm_id, limit)
