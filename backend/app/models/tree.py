import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class TreeHealthStatus(str, enum.Enum):
    HEALTHY = "HEALTHY"
    DISEASE_DETECTED = "DISEASE_DETECTED"
    UNKNOWN = "UNKNOWN"

class Tree(Base):
    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    tree_number = Column(String(50), nullable=False)
    row_number = Column(Integer, nullable=False)
    column_number = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    variety = Column(String(100), default="Alphonso / Banganapalli", nullable=False)
    health_status = Column(Enum(TreeHealthStatus, name="tree_health_enum"), default=TreeHealthStatus.UNKNOWN, nullable=False, index=True)
    last_inspected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("farm_id", "row_number", "column_number", name="uq_farm_row_col"),
    )

    # Relationships
    farm = relationship("Farm", back_populates="trees")
    images = relationship("Image", back_populates="tree", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="tree", cascade="all, delete-orphan")
