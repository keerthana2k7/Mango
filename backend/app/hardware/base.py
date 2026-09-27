from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class CameraDeviceInterface(ABC):
    """Abstract interface representing either a software simulation or hardware ESP32 camera."""
    @abstractmethod
    async def capture_frame(self, target_id: str) -> bytes:
        pass

    @abstractmethod
    def get_device_status(self) -> Dict[str, Any]:
        pass

class MotorControllerInterface(ABC):
    """Abstract interface for carriage movement (simulated rail vs stepper motor controller)."""
    @abstractmethod
    async def move_to_checkpoint(self, row: int, col: int) -> bool:
        pass

    @abstractmethod
    def set_speed(self, speed_m_per_s: float) -> None:
        pass

    @abstractmethod
    def home(self) -> bool:
        pass
