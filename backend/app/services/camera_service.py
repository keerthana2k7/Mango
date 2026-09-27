from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.camera import Camera, CameraStatus
from app.schemas.camera import CameraCreate, CameraUpdate

class CameraService:
    @staticmethod
    def get_by_id(db: Session, camera_id: int) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.id == camera_id).first()

    @staticmethod
    def get_by_farm(db: Session, farm_id: int) -> List[Camera]:
        return db.query(Camera).filter(Camera.farm_id == farm_id).all()

    @staticmethod
    def create(db: Session, camera_in: CameraCreate) -> Camera:
        camera = Camera(**camera_in.model_dump())
        db.add(camera)
        db.commit()
        db.refresh(camera)
        return camera

    @staticmethod
    def update(db: Session, camera: Camera, camera_in: CameraUpdate) -> Camera:
        update_data = camera_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(camera, field, value)
        db.commit()
        db.refresh(camera)
        return camera

camera_service = CameraService()
