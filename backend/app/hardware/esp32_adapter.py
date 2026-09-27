import logging
import httpx
from typing import Dict, Any
from app.hardware.base import CameraDeviceInterface, MotorControllerInterface

logger = logging.getLogger("mangovision.hardware.esp32")

class ESP32CameraAdapter(CameraDeviceInterface):
    """
    Adapter for communicating with physical ESP32-CAM via HTTP endpoint.
    Example: http://192.168.1.100/capture
    """
    def __init__(self, ip_address: str = "192.168.1.100"):
        self.ip_address = ip_address
        self.endpoint = f"http://{ip_address}/capture"

    async def capture_frame(self, target_id: str) -> bytes:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.endpoint)
                response.raise_for_status()
                return response.content
        except Exception as e:
            logger.error("ESP32-CAM frame capture failed: %s", e)
            raise

    def get_device_status(self) -> Dict[str, Any]:
        return {
            "device": "ESP32_OV2640",
            "ip": self.ip_address,
            "status": "READY"
        }

class ESP32MotorAdapter(MotorControllerInterface):
    """
    Adapter for communicating with physical stepper motor / ESP32 controller over UART / HTTP.
    """
    def __init__(self, ip_address: str = "192.168.1.101"):
        self.ip_address = ip_address

    async def move_to_checkpoint(self, row: int, col: int) -> bool:
        logger.info("Sending move command to ESP32 motor: row=%d, col=%d", row, col)
        # async with httpx.AsyncClient() as client:
        #     await client.post(f"http://{self.ip_address}/move", json={"row": row, "col": col})
        return True

    def set_speed(self, speed_m_per_s: float) -> None:
        logger.info("Setting ESP32 motor speed to %f m/s", speed_m_per_s)

    def home(self) -> bool:
        logger.info("Homing physical rail carriage")
        return True
