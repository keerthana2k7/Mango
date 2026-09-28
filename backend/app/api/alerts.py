from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.alert import AlertResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    farm_id: Optional[int] = Query(None, description="Filter by farm ID"),
    unresolved_only: bool = Query(False, description="Filter for unresolved alerts only"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve automated disease detection alerts and system notifications."""
    return alert_service.get_alerts(db=db, farm_id=farm_id, unresolved_only=unresolved_only, limit=limit)

@router.get("/active-count")
def get_active_count(
    farm_id: Optional[int] = Query(None, description="Filter by farm ID"),
    db: Session = Depends(get_db)
):
    """Get total number of unresolved alerts for notification indicators."""
    count = alert_service.get_active_count(db=db, farm_id=farm_id)
    return {"active_alerts_count": count}

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Acknowledge an active alert without resolving it."""
    alert = alert_service.acknowledge_alert(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """Mark an alert as resolved after treatment or remediation."""
    alert = alert_service.resolve_alert(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
