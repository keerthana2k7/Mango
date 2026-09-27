import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CameraStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    MOVING = "MOVING"
    CAPTURING = "CAPTURING"
    ERROR = "ERROR"

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), default="SIMULATED_RAIL_CAM", nullable=False)
    status = Column(Enum(CameraStatus, name="camera_status_enum"), default=CameraStatus.ONLINE, nullable=False)
    current_row = Column(Integer, default=1, nullable=False)
    current_column = Column(Integer, default=1, nullable=False)
    current_tree_id = Column(Integer, ForeignKey("trees.id", ondelete="SET NULL"), nullable=True)
    rail_position_meters = Column(Float, default=0.0, nullable=False)
    speed_m_per_s = Column(Float, default=1.0, nullable=False)
    battery_percentage = Column(Float, default=95.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="cameras")
    current_tree = relationship("Tree", foreign_keys=[current_tree_id])
    images = relationship("Image", back_populates="camera", cascade="all, delete-orphan")
