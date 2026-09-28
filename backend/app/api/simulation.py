from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.simulation import (
    SimulationControlCommand,
    SimulationStatusResponse,
    SimulateDiseaseRequest,
    SimulateDiseaseResponse
)
from app.services.simulation_service import simulation_engine

router = APIRouter(tags=["Simulation"])

@router.get("/cameras/{camera_id}/simulation/status", response_model=SimulationStatusResponse)
def get_simulation_status(camera_id: int, db: Session = Depends(get_db)):
    res = simulation_engine.get_status(db, camera_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/cameras/{camera_id}/simulation/start", response_model=SimulationStatusResponse)
def start_simulation(camera_id: int, cmd: SimulationControlCommand = None, db: Session = Depends(get_db)):
    speed = cmd.speed if cmd else None
    res = simulation_engine.start(camera_id, speed)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/cameras/{camera_id}/simulation/pause", response_model=SimulationStatusResponse)
def pause_simulation(camera_id: int, db: Session = Depends(get_db)):
    res = simulation_engine.pause(camera_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/cameras/{camera_id}/simulation/stop", response_model=SimulationStatusResponse)
def stop_simulation(camera_id: int, db: Session = Depends(get_db)):
    res = simulation_engine.stop(camera_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/cameras/{camera_id}/simulation/reset", response_model=SimulationStatusResponse)
def reset_simulation(camera_id: int, db: Session = Depends(get_db)):
    res = simulation_engine.reset(camera_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/cameras/{camera_id}/simulation/step", response_model=SimulationStatusResponse)
async def step_simulation(camera_id: int):
    res = await simulation_engine.step(camera_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/cameras/{camera_id}/simulation/simulate-disease", response_model=SimulateDiseaseResponse)
async def simulate_disease(camera_id: int, req: SimulateDiseaseRequest = None):
    req = req or SimulateDiseaseRequest()
    res = await simulation_engine.simulate_disease(
        camera_id=camera_id,
        disease_name=req.disease_name,
        tree_id=req.tree_id,
        severity=req.severity,
        operator_notes=req.operator_notes
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res
