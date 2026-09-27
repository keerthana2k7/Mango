import asyncio
import io
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from PIL import Image as PILImage, ImageDraw
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.camera import Camera, CameraStatus
from app.models.farm import Farm
from app.models.tree import Tree
from app.services.image_service import image_service
from app.services.prediction_service import prediction_service

class SimulationRuntimeState:
    def __init__(self, camera_id: int):
        self.camera_id = camera_id
        self.status = CameraStatus.ONLINE
        self.is_running = False
        self.current_row = 1
        self.current_col = 1
        self.rail_position = 0.0
        self.direction = 1  # 1 = forward (1->N), -1 = backward (N->1)
        self.speed_m_per_s = 1.0
        self.last_event = "Simulation Initialized"
        self.last_captured_image_id: Optional[int] = None
        self.last_prediction: Optional[Dict[str, Any]] = None
        self.task: Optional[asyncio.Task] = None

class SimulationEngine:
    _instance: Optional["SimulationEngine"] = None

    def __init__(self):
        self.states: Dict[int, SimulationRuntimeState] = {}

    @classmethod
    def get_instance(cls) -> "SimulationEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_or_create_state(self, camera_id: int) -> SimulationRuntimeState:
        if camera_id not in self.states:
            self.states[camera_id] = SimulationRuntimeState(camera_id)
        return self.states[camera_id]

    def _generate_synthetic_leaf_bytes(self, tree_number: str) -> bytes:
        """Generates a clean synthetic RGB leaf image for simulated capture."""
        img = PILImage.new("RGB", (400, 400), color=(240, 248, 240))
        draw = ImageDraw.Draw(img)
        # Draw leaf shape
        draw.ellipse([80, 50, 320, 350], fill=(46, 125, 50), outline=(27, 94, 32), width=4)
        draw.line([200, 50, 200, 350], fill=(27, 94, 32), width=3)
        # Add tree label watermark
        draw.text((120, 180), f"Mango Leaf\n{tree_number}", fill=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return buf.getvalue()

    async def step(self, camera_id: int) -> Dict[str, Any]:
        """Advances the simulation deterministically by 1 step / tree checkpoint."""
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if not camera:
                return {"error": "Camera not found"}

            farm = db.query(Farm).filter(Farm.id == camera.farm_id).first()
            if not farm:
                return {"error": "Farm not found"}

            state = self._get_or_create_state(camera_id)
            total_rows = farm.total_rows or 4
            trees_per_row = farm.trees_per_row or 6

            # Move to next tree column
            state.current_col += 1
            if state.current_col > trees_per_row:
                state.current_col = 1
                state.current_row += 1
                if state.current_row > total_rows:
                    state.current_row = 1  # Loop back or complete

            # Find matching tree in database
            tree = db.query(Tree).filter(
                Tree.farm_id == farm.id,
                Tree.row_number == state.current_row,
                Tree.column_number == state.current_col
            ).first()

            if tree:
                camera.current_tree_id = tree.id
                camera.current_row = state.current_row
                camera.current_column = state.current_col
                camera.status = CameraStatus.CAPTURING
                db.commit()

                # Generate capture & ML prediction
                leaf_bytes = self._generate_synthetic_leaf_bytes(tree.tree_number)
                saved_image = await image_service.upload_and_create(
                    db=db,
                    farm_id=farm.id,
                    tree_id=tree.id,
                    file_bytes=leaf_bytes,
                    filename=f"sim_leaf_r{state.current_row}_c{state.current_col}.jpg",
                    camera_id=camera.id,
                    image_type="SIMULATED_RGB_LEAF"
                )

                prediction = prediction_service.run_prediction_for_image(db, saved_image)
                
                state.last_captured_image_id = saved_image.id
                state.last_prediction = {
                    "id": prediction.id,
                    "disease_name": prediction.disease_name,
                    "confidence": prediction.confidence,
                    "symptoms": prediction.symptoms,
                    "treatment": prediction.treatment_recommendation,
                    "is_mock": prediction.is_mock
                }
                state.last_event = f"Inspected {tree.tree_number}: {prediction.disease_name} ({int(prediction.confidence*100)}%)"
                camera.status = CameraStatus.MOVING if state.is_running else CameraStatus.ONLINE
                db.commit()

            return self.get_status(db, camera_id)
        finally:
            db.close()

    async def _run_loop(self, camera_id: int):
        state = self._get_or_create_state(camera_id)
        while state.is_running:
            await self.step(camera_id)
            # Sleep based on camera speed (e.g. 3s / speed)
            delay = max(1.0, 3.0 / max(0.1, state.speed_m_per_s))
            await asyncio.sleep(delay)

    def start(self, camera_id: int, speed: Optional[float] = None) -> Dict[str, Any]:
        state = self._get_or_create_state(camera_id)
        if speed is not None and speed > 0:
            state.speed_m_per_s = speed
        
        state.is_running = True
        state.status = CameraStatus.MOVING
        state.last_event = "Simulation Started"

        if state.task is None or state.task.done():
            state.task = asyncio.create_task(self._run_loop(camera_id))

        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if camera:
                camera.status = CameraStatus.MOVING
                db.commit()
            return self.get_status(db, camera_id)
        finally:
            db.close()

    def pause(self, camera_id: int) -> Dict[str, Any]:
        state = self._get_or_create_state(camera_id)
        state.is_running = False
        state.status = CameraStatus.ONLINE
        state.last_event = "Simulation Paused"
        if state.task and not state.task.done():
            state.task.cancel()

        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if camera:
                camera.status = CameraStatus.ONLINE
                db.commit()
            return self.get_status(db, camera_id)
        finally:
            db.close()

    def stop(self, camera_id: int) -> Dict[str, Any]:
        state = self._get_or_create_state(camera_id)
        state.is_running = False
        state.status = CameraStatus.ONLINE
        state.last_event = "Simulation Stopped"
        if state.task and not state.task.done():
            state.task.cancel()

        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if camera:
                camera.status = CameraStatus.ONLINE
                db.commit()
            return self.get_status(db, camera_id)
        finally:
            db.close()

    def reset(self, camera_id: int) -> Dict[str, Any]:
        state = self._get_or_create_state(camera_id)
        state.is_running = False
        state.status = CameraStatus.ONLINE
        state.current_row = 1
        state.current_col = 1
        state.rail_position = 0.0
        state.last_event = "Simulation Reset to Origin (Row 1, Tree 1)"
        if state.task and not state.task.done():
            state.task.cancel()

        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if camera:
                camera.status = CameraStatus.ONLINE
                camera.current_row = 1
                camera.current_column = 1
                camera.rail_position_meters = 0.0
                first_tree = db.query(Tree).filter(Tree.farm_id == camera.farm_id, Tree.row_number == 1, Tree.column_number == 1).first()
                if first_tree:
                    camera.current_tree_id = first_tree.id
                db.commit()
            return self.get_status(db, camera_id)
        finally:
            db.close()

    def get_status(self, db: Session, camera_id: int) -> Dict[str, Any]:
        state = self._get_or_create_state(camera_id)
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            return {"error": "Camera not found"}

        farm = db.query(Farm).filter(Farm.id == camera.farm_id).first()
        total_rows = farm.total_rows if farm else 4
        trees_per_row = farm.trees_per_row if farm else 6
        total_trees = total_rows * trees_per_row

        x_margin = 15.0
        y_margin = 16.0
        x_spacing = 18.0
        y_spacing = 22.0

        # Calculate exact spatial x, y coordinates in meters
        current_x = round(x_margin + (state.current_col - 1) * x_spacing, 2)
        current_y = round(y_margin + (state.current_row - 1) * y_spacing, 2)
        direction_str = "FORWARD" if (state.current_row % 2 == 1) else "BACKWARD"

        current_step_num = ((state.current_row - 1) * trees_per_row) + state.current_col
        progress = round((current_step_num / total_trees) * 100.0, 1)

        current_tree = None
        if camera.current_tree_id:
            current_tree = db.query(Tree).filter(Tree.id == camera.current_tree_id).first()

        return {
            "camera_id": camera.id,
            "farm_id": camera.farm_id,
            "status": camera.status,
            "x": current_x,
            "y": current_y,
            "z": 5.5,
            "current_row": state.current_row,

            "current_column": state.current_col,
            "direction": direction_str,
            "current_tree_id": camera.current_tree_id,
            "current_tree_number": current_tree.tree_number if current_tree else f"T-R{state.current_row:02d}-C{state.current_col:02d}",
            "current_tree_health": current_tree.health_status.value if (current_tree and hasattr(current_tree.health_status, 'value')) else (current_tree.health_status if current_tree else "UNKNOWN"),
            "rail_position_meters": round(current_step_num * x_spacing, 2),
            "total_rail_length_meters": round(total_trees * x_spacing, 2),
            "progress_percentage": progress,
            "speed_m_per_s": state.speed_m_per_s,
            "is_capturing": (camera.status == CameraStatus.CAPTURING),
            "last_event": state.last_event,
            "last_captured_image_id": state.last_captured_image_id,
            "last_prediction": state.last_prediction,
            "updated_at": datetime.now(timezone.utc)
        }


simulation_engine = SimulationEngine.get_instance()
