from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id", ondelete="CASCADE"), nullable=False, index=True)
    disease_name = Column(String(100), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    class_id = Column(Integer, nullable=False)
    model_version = Column(String(50), nullable=False, default="v1.0.0")
    is_mock = Column(Boolean, default=False, nullable=False)
    symptoms = Column(Text, nullable=True)
    treatment_recommendation = Column(Text, nullable=True)
    prediction_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    image = relationship("Image", back_populates="prediction")
    tree = relationship("Tree", back_populates="predictions")
