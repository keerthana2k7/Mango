from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    area_acres = Column(Float, nullable=False, default=1.0)
    total_rows = Column(Integer, nullable=False, default=4)
    trees_per_row = Column(Integer, nullable=False, default=6)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    trees = relationship("Tree", back_populates="farm", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="farm", cascade="all, delete-orphan")
    images = relationship("Image", back_populates="farm", cascade="all, delete-orphan")
    treatments = relationship("Treatment", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="farm", cascade="all, delete-orphan")
