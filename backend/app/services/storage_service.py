import os
import io
import uuid
import aiofiles
from PIL import Image
from app.core.config import settings

class StorageService:
    def __init__(self, base_dir: str = settings.STORAGE_PATH):
        self.base_dir = base_dir
        self.images_dir = os.path.join(self.base_dir, "images")
        self.thumbnails_dir = os.path.join(self.base_dir, "thumbnails")
        self._ensure_dirs()

    def _ensure_dirs(self):
        os.makedirs(self.images_dir, exist_ok=True)
        os.makedirs(self.thumbnails_dir, exist_ok=True)

    async def save_image(self, file_bytes: bytes, original_filename: str) -> tuple[str, str]:
        """
        Saves image and thumbnail to storage directory.
        Returns relative paths: (image_rel_path, thumbnail_rel_path)
        """
        import re
        base_slug = re.sub(r"[^a-zA-Z0-9_\-]", "_", os.path.splitext(original_filename)[0])[:40].strip("_")
        ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
        if base_slug:
            unique_name = f"{base_slug}_{uuid.uuid4().hex[:8]}{ext}"
        else:
            unique_name = f"{uuid.uuid4().hex}{ext}"
        
        image_path = os.path.join(self.images_dir, unique_name)
        thumb_name = f"thumb_{unique_name}"
        thumb_path = os.path.join(self.thumbnails_dir, thumb_name)

        # Write original
        async with aiofiles.open(image_path, "wb") as f:
            await f.write(file_bytes)

        # Generate thumbnail
        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            img.thumbnail((250, 250))
            img.save(thumb_path, "JPEG", quality=85)
            thumb_rel = f"thumbnails/{thumb_name}"
        except Exception:
            thumb_rel = None

        return f"images/{unique_name}", thumb_rel

    def get_absolute_path(self, relative_path: str) -> str:
        return os.path.join(self.base_dir, relative_path)

storage_service = StorageService()
