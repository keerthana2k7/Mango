from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut, FarmLayoutResponse
from app.schemas.tree import TreeOut, TreeCreate
from app.services.farm_service import farm_service
from app.services.tree_service import tree_service
from app.services.camera_service import camera_service
from app.schemas.camera import CameraOut

router = APIRouter(prefix="/farms", tags=["Farms"])

@router.get("/{farm_id}/layout", response_model=FarmLayoutResponse)
def get_farm_layout(farm_id: int, db: Session = Depends(get_db)):
    layout = farm_service.get_layout(db, farm_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Farm layout not found")
    return layout


@router.get("", response_model=List[FarmOut])
def list_farms(db: Session = Depends(get_db)):
    return farm_service.get_all(db)

@router.post("", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.FARM_MANAGER]))
):
    farm = farm_service.create(db, farm_in)
    return farm_service.get_by_id(db, farm.id)

@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = farm_service.get_by_id(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    # Return aggregated version
    farms = farm_service.get_all(db)
    for f in farms:
        if f.id == farm_id:
            return f
    return farm

@router.put("/{farm_id}", response_model=FarmOut)
def update_farm(
    farm_id: int,
    farm_in: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.FARM_MANAGER]))
):
    farm = farm_service.get_by_id(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm_service.update(db, farm, farm_in)

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    success = farm_service.delete(db, farm_id)
    if not success:
        raise HTTPException(status_code=404, detail="Farm not found")

@router.get("/{farm_id}/trees", response_model=List[TreeOut])
def get_farm_trees(farm_id: int, db: Session = Depends(get_db)):
    return tree_service.get_by_farm_grid(db, farm_id)

@router.post("/{farm_id}/trees", response_model=TreeOut, status_code=status.HTTP_201_CREATED)
def add_tree_to_farm(
    farm_id: int,
    tree_in: TreeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.FARM_MANAGER]))
):
    tree_in.farm_id = farm_id
    return tree_service.create(db, tree_in)

@router.get("/{farm_id}/cameras", response_model=List[CameraOut])
def get_farm_cameras(farm_id: int, db: Session = Depends(get_db)):
    return camera_service.get_by_farm(db, farm_id)
