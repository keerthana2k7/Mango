from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.tree import TreeOut, TreeUpdate
from app.schemas.image import ImageOut
from app.schemas.prediction import PredictionOut
from app.services.tree_service import tree_service
from app.services.image_service import image_service
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/trees", tags=["Trees"])

@router.get("/{tree_id}", response_model=TreeOut)
def get_tree(tree_id: int, db: Session = Depends(get_db)):
    tree = tree_service.get_by_id(db, tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree

@router.put("/{tree_id}", response_model=TreeOut)
def update_tree(
    tree_id: int,
    tree_in: TreeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.FARM_MANAGER]))
):
    tree = tree_service.get_by_id(db, tree_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return tree_service.update(db, tree, tree_in)

@router.get("/{tree_id}/images", response_model=List[ImageOut])
def get_tree_images(tree_id: int, db: Session = Depends(get_db)):
    return image_service.get_by_tree(db, tree_id)

@router.get("/{tree_id}/predictions", response_model=List[PredictionOut])
def get_tree_predictions(tree_id: int, db: Session = Depends(get_db)):
    return prediction_service.get_by_tree(db, tree_id)
