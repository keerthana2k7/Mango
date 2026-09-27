from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analytics import FarmAnalyticsSummary
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=FarmAnalyticsSummary)
def get_dashboard_summary(farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    return analytics_service.get_dashboard_analytics(db, farm_id)
