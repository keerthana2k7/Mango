import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert, AlertSeverity, AlertType

logger = logging.getLogger("mangovision.alerts")

class AlertService:
    @staticmethod
    def create_alert(
        db: Session,
        farm_id: int,
        title: str,
        message: str,
        tree_id: Optional[int] = None,
        camera_id: Optional[int] = None,
        alert_type: AlertType = AlertType.DISEASE_DETECTED,
        severity: AlertSeverity = AlertSeverity.HIGH,
    ) -> Alert:
        alert = Alert(
            farm_id=farm_id,
            tree_id=tree_id,
            camera_id=camera_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            is_acknowledged=False,
            is_resolved=False,
            created_at=datetime.now(timezone.utc)
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        logger.info("Created alert [%s] %s for Tree %s", severity.value, title, tree_id)
        return alert

    @staticmethod
    def get_alerts(
        db: Session,
        farm_id: Optional[int] = None,
        unresolved_only: bool = False,
        limit: int = 50
    ) -> List[Alert]:
        query = db.query(Alert)
        if farm_id is not None:
            query = query.filter(Alert.farm_id == farm_id)
        if unresolved_only:
            query = query.filter(Alert.is_resolved == False)
        return query.order_by(Alert.created_at.desc()).limit(limit).all()

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_acknowledged = True
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_acknowledged = True
            alert.is_resolved = True
            alert.resolved_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def get_active_count(db: Session, farm_id: Optional[int] = None) -> int:
        query = db.query(Alert).filter(Alert.is_resolved == False)
        if farm_id is not None:
            query = query.filter(Alert.farm_id == farm_id)
        return query.count()

alert_service = AlertService()
