from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.tree import Tree, TreeHealthStatus
from app.models.prediction import Prediction
from app.schemas.tree import TreeCreate, TreeUpdate, TreeOut, LatestPredictionSummary

class TreeService:
    @staticmethod
    def get_by_id(db: Session, tree_id: int) -> Optional[Tree]:
        return db.query(Tree).filter(Tree.id == tree_id).first()

    @staticmethod
    def get_by_farm_grid(db: Session, farm_id: int) -> List[TreeOut]:
        trees = db.query(Tree).filter(Tree.farm_id == farm_id).order_by(Tree.row_number, Tree.column_number).all()
        result = []
        for t in trees:
            # Fetch latest prediction
            latest_pred = db.query(Prediction).filter(Prediction.tree_id == t.id).order_by(Prediction.prediction_time.desc()).first()
            latest_summary = None
            if latest_pred:
                latest_summary = LatestPredictionSummary(
                    id=latest_pred.id,
                    disease_name=latest_pred.disease_name,
                    confidence=latest_pred.confidence,
                    is_mock=latest_pred.is_mock,
                    prediction_time=latest_pred.prediction_time
                )
            
            tree_out = TreeOut(
                id=t.id,
                farm_id=t.farm_id,
                tree_number=t.tree_number,
                row_number=t.row_number,
                column_number=t.column_number,
                latitude=t.latitude,
                longitude=t.longitude,
                variety=t.variety,
                health_status=t.health_status,
                last_inspected_at=t.last_inspected_at,
                created_at=t.created_at,
                updated_at=t.updated_at,
                latest_prediction=latest_summary
            )
            result.append(tree_out)
        return result

    @staticmethod
    def create(db: Session, tree_in: TreeCreate) -> Tree:
        tree = Tree(**tree_in.model_dump())
        db.add(tree)
        db.commit()
        db.refresh(tree)
        return tree

    @staticmethod
    def update(db: Session, tree: Tree, tree_in: TreeUpdate) -> Tree:
        update_data = tree_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tree, field, value)
        db.commit()
        db.refresh(tree)
        return tree

tree_service = TreeService()
