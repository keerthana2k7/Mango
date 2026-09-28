from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.farm import Farm
from app.models.tree import Tree, TreeHealthStatus
from app.models.camera import Camera, CameraStatus
from app.models.image import Image
from app.models.prediction import Prediction
from app.schemas.analytics import FarmAnalyticsSummary, HealthDistribution, DiseaseCountItem
from app.ml.model_loader import model_loader

class AnalyticsService:
    @staticmethod
    def get_dashboard_analytics(db: Session, farm_id: Optional[int] = None) -> FarmAnalyticsSummary:
        farm = None
        if farm_id:
            farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            farm = db.query(Farm).first()

        farm_id_val = farm.id if farm else 1
        farm_name_val = farm.name if farm else "Salem Mango Orchard"

        # Tree counts
        total_trees = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm_id_val).scalar() or 0
        healthy_trees = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm_id_val, Tree.health_status == TreeHealthStatus.HEALTHY).scalar() or 0
        diseased_trees = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm_id_val, Tree.health_status == TreeHealthStatus.DISEASE_DETECTED).scalar() or 0
        treated_trees = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm_id_val, Tree.health_status == TreeHealthStatus.TREATED).scalar() or 0
        unknown_trees = db.query(func.count(Tree.id)).filter(Tree.farm_id == farm_id_val, Tree.health_status == TreeHealthStatus.UNKNOWN).scalar() or 0

        health_pct = round((healthy_trees / total_trees * 100.0), 1) if total_trees > 0 else 0.0
        diseased_pct = round((diseased_trees / total_trees * 100.0), 1) if total_trees > 0 else 0.0
        treated_pct = round((treated_trees / total_trees * 100.0), 1) if total_trees > 0 else 0.0
        unknown_pct = round((unknown_trees / total_trees * 100.0), 1) if total_trees > 0 else 0.0

        # Disease breakdown
        disease_counts = (
            db.query(Prediction.disease_name, func.count(Prediction.id))
            .join(Tree)
            .filter(Tree.farm_id == farm_id_val, Prediction.disease_name != "Healthy")
            .group_by(Prediction.disease_name)
            .all()
        )
        total_disease_predictions = sum(count for _, count in disease_counts) or 1

        disease_breakdown: List[DiseaseCountItem] = []
        for d_name, count in disease_counts:
            pct = round((count / total_disease_predictions * 100.0), 1)
            severity = "HIGH" if "canker" in d_name.lower() or "anthracnose" in d_name.lower() or "die" in d_name.lower() else "MEDIUM"
            disease_breakdown.append(DiseaseCountItem(
                disease_name=d_name,
                count=count,
                percentage=pct,
                severity=severity
            ))

        # Sort disease breakdown descending
        disease_breakdown.sort(key=lambda x: x.count, reverse=True)

        # Active cameras
        active_cams = db.query(func.count(Camera.id)).filter(
            Camera.farm_id == farm_id_val,
            Camera.status.in_([CameraStatus.ONLINE, CameraStatus.MOVING, CameraStatus.CAPTURING])
        ).scalar() or 0

        # Total images & predictions
        total_images = db.query(func.count(Image.id)).filter(Image.farm_id == farm_id_val).scalar() or 0
        total_predictions = db.query(func.count(Prediction.id)).join(Tree).filter(Tree.farm_id == farm_id_val).scalar() or 0

        # Recent activity (latest 10 predictions)
        recent_preds = (
            db.query(Prediction, Tree.tree_number)
            .join(Tree, Prediction.tree_id == Tree.id)
            .filter(Tree.farm_id == farm_id_val)
            .order_by(Prediction.prediction_time.desc())
            .limit(10)
            .all()
        )
        activity_list = []
        for p, tree_num in recent_preds:
            activity_list.append({
                "id": p.id,
                "tree_number": tree_num,
                "tree_id": p.tree_id,
                "disease_name": p.disease_name,
                "confidence": p.confidence,
                "is_mock": p.is_mock,
                "prediction_time": p.prediction_time.isoformat()
            })

        return FarmAnalyticsSummary(
            farm_id=farm_id_val,
            farm_name=farm_name_val,
            total_trees=total_trees,
            health_score=health_pct,
            health_distribution=HealthDistribution(
                healthy_count=healthy_trees,
                healthy_percentage=health_pct,
                diseased_count=diseased_trees,
                diseased_percentage=diseased_pct,
                treated_count=treated_trees,
                treated_percentage=treated_pct,
                unknown_count=unknown_trees,
                unknown_percentage=unknown_pct
            ),
            disease_breakdown=disease_breakdown,
            active_cameras=active_cams,
            total_images_captured=total_images,
            total_predictions_made=total_predictions,
            recent_activity=activity_list
        )

    @staticmethod
    def generate_orchard_audit_csv(db: Session, farm_id: Optional[int] = None) -> str:
        import csv
        import io
        from app.models.treatment import Treatment

        farm = db.query(Farm).filter(Farm.id == farm_id).first() if farm_id else db.query(Farm).first()
        farm_id_val = farm.id if farm else 1

        trees = db.query(Tree).filter(Tree.farm_id == farm_id_val).order_by(Tree.row_number, Tree.column_number).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Tree ID",
            "Tree Number",
            "Row",
            "Column",
            "Variety",
            "Health Status",
            "Last Inspected At",
            "Latest Pathogen Detected",
            "AI Confidence %",
            "Recommended Agronomic Treatment",
            "Latest Intervention Chemical",
            "Intervention Date",
            "Operator"
        ])

        for tree in trees:
            latest_pred = db.query(Prediction).filter(Prediction.tree_id == tree.id).order_by(Prediction.prediction_time.desc()).first()
            latest_treatment = db.query(Treatment).filter(Treatment.tree_id == tree.id).order_by(Treatment.treated_at.desc()).first()

            pathogen = latest_pred.disease_name if latest_pred else ("Healthy" if tree.health_status == TreeHealthStatus.HEALTHY else "None")
            confidence = f"{int(latest_pred.confidence * 100)}%" if latest_pred else "N/A"
            recom = latest_pred.treatment_recommendation if latest_pred and latest_pred.treatment_recommendation else "Routine orchard maintenance"
            chem = latest_treatment.chemical_name if latest_treatment else "None"
            t_date = latest_treatment.treated_at.strftime("%Y-%m-%d %H:%M") if latest_treatment else "N/A"
            op = latest_treatment.operator_name if latest_treatment else "N/A"
            insp_date = tree.last_inspected_at.strftime("%Y-%m-%d %H:%M") if tree.last_inspected_at else "Not Inspected"

            writer.writerow([
                tree.id,
                tree.tree_number,
                tree.row_number,
                tree.column_number,
                tree.variety,
                tree.health_status.value,
                insp_date,
                pathogen,
                confidence,
                recom,
                chem,
                t_date,
                op
            ])

        return output.getvalue()

analytics_service = AnalyticsService()
