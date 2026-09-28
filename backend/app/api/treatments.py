from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.tree import Tree
from app.schemas.treatment import TreatmentCreate, TreatmentResponse, BatchTreatmentCreate, BatchTreatmentResponse
from app.services.treatment_service import treatment_service

router = APIRouter(prefix="/treatments", tags=["Treatments"])

@router.post("", response_model=TreatmentResponse)
def log_treatment(
    data: TreatmentCreate,
    db: Session = Depends(get_db)
):
    """Log an agronomic intervention (chemical spray, organic treatment, pruning) for a tree."""
    tree = db.query(Tree).filter(Tree.id == data.tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")

    return treatment_service.create_treatment(db=db, farm_id=tree.farm_id, data=data)

@router.post("/batch", response_model=BatchTreatmentResponse)
def batch_treat_trees(
    data: BatchTreatmentCreate,
    db: Session = Depends(get_db)
):
    """Batch apply remedial spray to all diseased trees on a farm and resolve alerts."""
    return treatment_service.batch_treat_farm_trees(
        db=db,
        farm_id=data.farm_id,
        chemical_name=data.chemical_name,
        dosage=data.dosage,
        operator_name=data.operator_name,
        treatment_type=data.treatment_type,
        notes=data.notes,
        target_health_status=data.target_health_status or "DISEASE_DETECTED"
    )

@router.get("/tree/{tree_id}", response_model=List[TreatmentResponse])

def get_tree_treatments(
    tree_id: int,
    db: Session = Depends(get_db)
):
    """Get chronological treatment and spray intervention history for a specific tree."""
    tree = db.query(Tree).filter(Tree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return treatment_service.get_by_tree(db=db, tree_id=tree_id)

@router.get("/farm/{farm_id}", response_model=List[TreatmentResponse])
def get_farm_treatments(
    farm_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get recent farm-wide treatment interventions."""
    return treatment_service.get_by_farm(db=db, farm_id=farm_id, limit=limit)
