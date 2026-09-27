import io
import logging
from typing import Dict, Any
from PIL import Image as PILImage, ImageDraw
from app.hardware.base import CameraDeviceInterface, MotorControllerInterface

logger = logging.getLogger("mangovision.hardware.sim")

class SimulationCameraAdapter(CameraDeviceInterface):
    async def capture_frame(self, target_id: str) -> bytes:
        img = PILImage.new("RGB", (400, 400), color=(240, 248, 240))
        draw = ImageDraw.Draw(img)
        draw.ellipse([80, 50, 320, 350], fill=(46, 125, 50), outline=(27, 94, 32), width=4)
        draw.line([200, 50, 200, 350], fill=(27, 94, 32), width=3)
        draw.text((120, 180), f"Simulated Frame\nTarget: {target_id}", fill=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return buf.getvalue()

    def get_device_status(self) -> Dict[str, Any]:
        return {
            "device": "SIMULATED_RAIL_CAM",
            "resolution": "1920x1080",
            "status": "ONLINE",
            "framerate": 30
        }

class SimulationMotorAdapter(MotorControllerInterface):
    def __init__(self):
        self.speed = 1.0
        self.current_pos = (1, 1)

    async def move_to_checkpoint(self, row: int, col: int) -> bool:
        self.current_pos = (row, col)
        logger.info("Simulation motor moved to checkpoint Row %d, Col %d", row, col)
        return True

    def set_speed(self, speed_m_per_s: float) -> None:
        self.speed = speed_m_per_s

    def home(self) -> bool:
        self.current_pos = (1, 1)
        return True
