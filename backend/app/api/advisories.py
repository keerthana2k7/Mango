from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.ml.model_loader import model_loader

router = APIRouter(prefix="/advisories", tags=["Advisories"])

@router.get("", response_model=List[Dict[str, Any]])
def get_all_advisories():
    """Retrieve full agronomy field directory of foliar mango diseases, symptoms, and control protocols."""
    return model_loader.classes

@router.get("/{disease_name}")
def get_advisory_by_name(disease_name: str):
    """Retrieve agronomic treatment and diagnostic profile for a specific mango pathogen."""
    clean_name = disease_name.strip().lower()
    for item in model_loader.classes:
        if item.get("name", "").strip().lower() == clean_name:
            return item
    raise HTTPException(status_code=404, detail=f"Advisory for '{disease_name}' not found")
