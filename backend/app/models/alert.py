import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class AlertType(str, enum.Enum):
    DISEASE_DETECTED = "DISEASE_DETECTED"
    CAMERA_OBSTRUCTION = "CAMERA_OBSTRUCTION"
    LOW_BATTERY = "LOW_BATTERY"
    MAINTENANCE_REQUIRED = "MAINTENANCE_REQUIRED"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id", ondelete="CASCADE"), nullable=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True, index=True)
    alert_type = Column(Enum(AlertType, name="alert_type_enum"), default=AlertType.DISEASE_DETECTED, nullable=False)
    severity = Column(Enum(AlertSeverity, name="alert_severity_enum"), default=AlertSeverity.HIGH, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    farm = relationship("Farm", back_populates="alerts")
    tree = relationship("Tree", back_populates="alerts")
    camera = relationship("Camera")
