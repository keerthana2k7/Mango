import enum
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TreatmentType(str, enum.Enum):
    CHEMICAL = "CHEMICAL"
    ORGANIC = "ORGANIC"
    PRUNING = "PRUNING"
    BIOLOGICAL = "BIOLOGICAL"

class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    tree_id = Column(Integer, ForeignKey("trees.id", ondelete="CASCADE"), nullable=False, index=True)
    chemical_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=True)
    operator_name = Column(String(100), nullable=False, default="Farm Operator")
    treatment_type = Column(Enum(TreatmentType, name="treatment_type_enum"), default=TreatmentType.CHEMICAL, nullable=False)
    notes = Column(Text, nullable=True)
    treated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="treatments")
    tree = relationship("Tree", back_populates="treatments")
