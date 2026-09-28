from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analytics import FarmAnalyticsSummary
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=FarmAnalyticsSummary)
def get_dashboard_summary(farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    return analytics_service.get_dashboard_analytics(db, farm_id)

@router.get("/export/csv")
def export_orchard_audit_csv(farm_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Export comprehensive orchard inspection and chemical treatment audit records as CSV."""
    csv_data = analytics_service.generate_orchard_audit_csv(db, farm_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=orchard_health_audit_farm_{farm_id or 1}.csv"
        }
    )
