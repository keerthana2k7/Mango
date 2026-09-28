import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.treatment import Treatment, TreatmentType
from app.models.tree import Tree, TreeHealthStatus
from app.models.alert import Alert
from app.schemas.treatment import TreatmentCreate

logger = logging.getLogger("mangovision.treatments")

class TreatmentService:
    @staticmethod
    def create_treatment(db: Session, farm_id: int, data: TreatmentCreate) -> Treatment:
        treatment = Treatment(
            farm_id=farm_id,
            tree_id=data.tree_id,
            chemical_name=data.chemical_name,
            dosage=data.dosage,
            operator_name=data.operator_name or "Farm Operator",
            treatment_type=data.treatment_type,
            notes=data.notes,
            treated_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        db.add(treatment)

        # Update Tree health status
        tree = db.query(Tree).filter(Tree.id == data.tree_id).first()
        if tree and data.update_tree_health:
            if data.new_health_status and data.new_health_status.upper() in TreeHealthStatus.__members__:
                tree.health_status = TreeHealthStatus[data.new_health_status.upper()]
            else:
                tree.health_status = TreeHealthStatus.TREATED
            tree.updated_at = datetime.now(timezone.utc)
            logger.info("Updated Tree %s health status to %s following treatment", tree.tree_number, tree.health_status)

        # Automatically resolve pending alerts for this tree
        active_alerts = db.query(Alert).filter(Alert.tree_id == data.tree_id, Alert.is_resolved == False).all()
        for alert in active_alerts:
            alert.is_acknowledged = True
            alert.is_resolved = True
            alert.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(treatment)
        return treatment

    @staticmethod
    def get_by_tree(db: Session, tree_id: int) -> List[Treatment]:
        return db.query(Treatment).filter(Treatment.tree_id == tree_id).order_by(Treatment.treated_at.desc()).all()

    @staticmethod
    def get_by_farm(db: Session, farm_id: int, limit: int = 50) -> List[Treatment]:
        return db.query(Treatment).filter(Treatment.farm_id == farm_id).order_by(Treatment.treated_at.desc()).limit(limit).all()

    @staticmethod
    def batch_treat_farm_trees(
        db: Session,
        farm_id: int,
        chemical_name: str,
        dosage: Optional[str] = "3.0 g / Litre",
        operator_name: Optional[str] = "Orchard Automation",
        treatment_type: TreatmentType = TreatmentType.CHEMICAL,
        notes: Optional[str] = None,
        target_health_status: str = "DISEASE_DETECTED"
    ) -> dict:
        target_status_enum = TreeHealthStatus.DISEASE_DETECTED if target_health_status == "DISEASE_DETECTED" else None
        
        query = db.query(Tree).filter(Tree.farm_id == farm_id)
        if target_status_enum:
            query = query.filter(Tree.health_status == target_status_enum)
        
        trees_to_treat = query.all()
        if not trees_to_treat:
            return {
                "farm_id": farm_id,
                "treated_count": 0,
                "chemical_name": chemical_name,
                "tree_numbers": [],
                "message": "No diseased trees requiring treatment on this parcel."
            }

        now_utc = datetime.now(timezone.utc)
        treated_tree_numbers = []

        for tree in trees_to_treat:
            treatment = Treatment(
                farm_id=farm_id,
                tree_id=tree.id,
                chemical_name=chemical_name,
                dosage=dosage,
                operator_name=operator_name or "Orchard Automation",
                treatment_type=treatment_type,
                notes=notes or f"Batch remediation spray for {tree.tree_number}",
                treated_at=now_utc,
                created_at=now_utc
            )
            db.add(treatment)
            tree.health_status = TreeHealthStatus.TREATED
            tree.updated_at = now_utc
            treated_tree_numbers.append(tree.tree_number)

            # Resolve active alerts for this tree
            alerts = db.query(Alert).filter(Alert.tree_id == tree.id, Alert.is_resolved == False).all()
            for al in alerts:
                al.is_acknowledged = True
                al.is_resolved = True
                al.resolved_at = now_utc

        db.commit()
        logger.info("Batch treated %d trees on farm %d with %s", len(trees_to_treat), farm_id, chemical_name)

        return {
            "farm_id": farm_id,
            "treated_count": len(trees_to_treat),
            "chemical_name": chemical_name,
            "tree_numbers": treated_tree_numbers,
            "message": f"Successfully applied {chemical_name} to {len(trees_to_treat)} trees. All active alerts resolved."
        }

treatment_service = TreatmentService()

