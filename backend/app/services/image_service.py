from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.image import Image, ProcessingStatus
from app.services.storage_service import storage_service

class ImageService:
    @staticmethod
    async def upload_and_create(
        db: Session,
        farm_id: int,
        tree_id: int,
        file_bytes: bytes,
        filename: str,
        camera_id: Optional[int] = None,
        image_type: str = "RGB_LEAF"
    ) -> Image:
        rel_path, thumb_rel_path = await storage_service.save_image(file_bytes, filename)
        image = Image(
            farm_id=farm_id,
            tree_id=tree_id,
            camera_id=camera_id,
            file_path=rel_path,
            thumbnail_path=thumb_rel_path,
            capture_time=datetime.now(timezone.utc),
            image_type=image_type,
            processing_status=ProcessingStatus.PENDING
        )
        db.add(image)
        db.commit()
        db.refresh(image)
        return image

    @staticmethod
    def get_by_id(db: Session, image_id: int) -> Optional[Image]:
        return db.query(Image).filter(Image.id == image_id).first()

    @staticmethod
    def get_by_tree(db: Session, tree_id: int) -> List[Image]:
        return db.query(Image).filter(Image.tree_id == tree_id).order_by(Image.capture_time.desc()).all()

    @staticmethod
    def get_by_farm(db: Session, farm_id: int, limit: int = 50) -> List[Image]:
        return db.query(Image).filter(Image.farm_id == farm_id).order_by(Image.capture_time.desc()).limit(limit).all()

image_service = ImageService()
