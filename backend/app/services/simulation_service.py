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

    def _generate_synthetic_leaf_bytes(
        self,
        tree_number: str,
        disease_name: str = "Healthy",
        severity: str = "HIGH"
    ) -> bytes:
        """
        Renders a photorealistic synthetic 600x600 RGB leaf image of a mango foliar specimen
        (lanceolate morphology, pinnate venation) with accurate pathology symptoms
        for diseases like Anthracnose (Colletotrichum gloeosporioides), Powdery Mildew, etc.
        """
        W, H = 600, 600
        img = PILImage.new("RGB", (W, H), color=(240, 244, 238))
        draw = ImageDraw.Draw(img)

        # 1. Subtle orchard grid background texture
        for gx in range(0, W, 40):
            draw.line([(gx, 0), (gx, H)], fill=(232, 238, 230), width=1)
        for gy in range(0, H, 40):
            draw.line([(0, gy), (W, gy)], fill=(232, 238, 230), width=1)

        # 2. Mango Leaf Blade (Lanceolate morphology)
        leaf_contour = [
            (300, 90),   # Acute apex
            (265, 130), (230, 190), (200, 270), (185, 350), (195, 430), (230, 490), (275, 525),
            (300, 545), # Petiole junction
            (325, 525), (370, 490), (405, 430), (415, 350), (400, 270), (370, 190), (335, 130),
        ]
        # Drop shadow
        shadow_contour = [(x + 8, y + 8) for (x, y) in leaf_contour]
        draw.polygon(shadow_contour, fill=(215, 222, 212))

        # Base leaf lamina color
        is_treated = disease_name.lower() == "treated"
        draw.polygon(leaf_contour, fill=(43, 110, 38), outline=(28, 75, 25), width=2)

        # Lateral pinnate venation
        vein_color = (68, 148, 56)
        vein_pairs = [
            ((250, 160), (300, 180), (350, 160)),
            ((225, 230), (300, 250), (375, 230)),
            ((205, 310), (300, 330), (395, 310)),
            ((198, 390), (300, 410), (402, 390)),
            ((215, 470), (300, 485), (385, 470)),
        ]
        for left_v, center_v, right_v in vein_pairs:
            draw.line([center_v, left_v], fill=vein_color, width=2)
            draw.line([center_v, right_v], fill=vein_color, width=2)

        # Central midrib
        draw.line([(300, 545), (300, 90)], fill=(85, 175, 68), width=4)

        # 3. Pathogen Symptom Simulation
        d_lower = disease_name.lower()
        if "anthracnose" in d_lower:
            # Apical necrosis (tip blight with irregular withered apex)
            tip_blight = [(300, 90), (280, 115), (295, 125), (305, 120), (320, 115)]
            draw.polygon(tip_blight, fill=(55, 32, 16))

            # Realistic Anthracnose necrotic lesions: (cx, cy, r_inner, r_halo)
            lesions = [
                (245, 240, 22, 36),
                (355, 320, 28, 44),
                (230, 370, 18, 28),
                (340, 210, 15, 25),
                (285, 440, 20, 32),
                (365, 410, 14, 22),
                (215, 290, 12, 19),
            ]
            for cx, cy, r, cr in lesions:
                # Chlorotic yellow halo
                draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(212, 222, 75))
                # Outer dark brown necrotic margin
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(62, 35, 18))
                # Concentric acervuli fungal target zone
                r_inner = max(3, int(r * 0.55))
                draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=(28, 14, 6))
                # Core necrotic pinhead
                r_core = max(2, int(r * 0.25))
                draw.ellipse([cx - r_core, cy - r_core, cx + r_core, cy + r_core], fill=(10, 5, 2))

            # CV Detection Bounding Box / Reticle on primary lesion
            target_box = [355 - 55, 320 - 55, 355 + 55, 320 + 55]
            draw.rectangle(target_box, outline=(244, 67, 54), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 185, target_box[1]], fill=(244, 67, 54))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Anthracnose Lesion: 95.8%", fill=(255, 255, 255))

        elif "powdery" in d_lower or "mildew" in d_lower:
            # Powdery Mildew: superficial white/grey fungal colonies
            spots = [(260, 210, 35), (340, 280, 42), (240, 350, 30), (330, 410, 28), (280, 320, 25)]
            for cx, cy, r in spots:
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(235, 238, 240), outline=(210, 215, 220), width=2)
            target_box = [340 - 50, 280 - 50, 340 + 50, 280 + 50]
            draw.rectangle(target_box, outline=(255, 179, 0), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 195, target_box[1]], fill=(255, 179, 0))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Powdery Mildew: 92.4%", fill=(0, 0, 0))

        elif "canker" in d_lower or "bacterial" in d_lower:
            # Bacterial Canker: angular lesions with bright yellow halos
            cankers = [(260, 220, 22, 34), (340, 330, 26, 40), (250, 390, 16, 26)]
            for cx, cy, r, cr in cankers:
                draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(255, 235, 59))
                draw.rectangle([cx - r, cy - r, cx + r, cy + r], fill=(50, 30, 15))
            target_box = [340 - 45, 330 - 45, 340 + 45, 330 + 45]
            draw.rectangle(target_box, outline=(255, 112, 67), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 180, target_box[1]], fill=(255, 112, 67))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Bacterial Canker: 91.0%", fill=(255, 255, 255))

        elif "die" in d_lower and ("back" in d_lower or "dieback" in d_lower):
            # Die Back: Progressive apical-to-basal drying & vascular necrosis
            dieback_wedge = [
                (300, 90), (265, 150), (275, 240), (290, 320), (300, 345),
                (310, 320), (325, 240), (335, 150)
            ]
            draw.polygon(dieback_wedge, fill=(58, 36, 20), outline=(42, 24, 12), width=2)
            # Marginal drying crinkles
            marginal_necro = [(205, 310, 18), (395, 310, 16), (220, 230, 15), (370, 240, 17)]
            for mx, my, mr in marginal_necro:
                draw.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(68, 42, 22), outline=(130, 90, 40))
            target_box = [300 - 55, 210 - 65, 300 + 55, 210 + 65]
            draw.rectangle(target_box, outline=(216, 67, 21), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 180, target_box[1]], fill=(216, 67, 21))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Die Back Necrosis: 94.6%", fill=(255, 255, 255))

        elif "gall" in d_lower or "midge" in d_lower:
            # Gall Midge: Wart-like blister pustules scattered across lamina
            galls = [
                (240, 190, 9), (345, 195, 8), (220, 260, 10), (365, 275, 9),
                (265, 335, 11), (335, 360, 9), (210, 410, 8), (375, 420, 9),
                (285, 240, 9), (310, 420, 8), (250, 455, 7), (340, 465, 8)
            ]
            for gx, gy, gr in galls:
                # Outer reddish-green elevated blister halo
                draw.ellipse([gx - gr - 4, gy - gr - 4, gx + gr + 4, gy + gr + 4], fill=(160, 130, 40), outline=(90, 80, 25))
                # Raised red-brown pustule
                draw.ellipse([gx - gr, gy - gr, gx + gr, gy + gr], fill=(140, 45, 35))
                # Central larval exit pore
                draw.ellipse([gx - 2, gy - 2, gx + 2, gy + 2], fill=(45, 15, 10))
            target_box = [265 - 45, 335 - 45, 265 + 45, 335 + 45]
            draw.rectangle(target_box, outline=(171, 71, 188), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 180, target_box[1]], fill=(171, 71, 188))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Gall Midge Pustule: 93.2%", fill=(255, 255, 255))

        elif "sooty" in d_lower or "mould" in d_lower or "mold" in d_lower:
            # Sooty Mould: Dense velvety charcoal-black mycelial coating
            patches = [
                (280, 230, 52), (335, 290, 58), (245, 345, 46),
                (320, 395, 50), (270, 440, 38)
            ]
            for px, py, pr in patches:
                draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(30, 34, 32), outline=(50, 56, 52))
                # Secondary velvety stipples
                draw.ellipse([px - int(pr*0.7), py - int(pr*0.7), px + int(pr*0.7), py + int(pr*0.7)], fill=(18, 20, 19))
            target_box = [335 - 55, 290 - 55, 335 + 55, 290 + 55]
            draw.rectangle(target_box, outline=(96, 125, 139), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 185, target_box[1]], fill=(96, 125, 139))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Sooty Mould Layer: 96.1%", fill=(255, 255, 255))

        elif "weevil" in d_lower or "cutting" in d_lower:
            # Cutting Weevil: Clean transverse scissor-like excision cutting across leaf blade
            # Cut away the top blade portion with background fill
            draw.polygon([
                (180, 80), (420, 80), (420, 235),
                (300, 235), (180, 235)
            ], fill=(240, 244, 238))
            # Cut border edge with cauterized necrosis line
            draw.line([(195, 235), (405, 235)], fill=(75, 45, 20), width=3)
            # Small bite notching along cut edge
            draw.ellipse([275, 230, 295, 242], fill=(60, 30, 15))
            draw.ellipse([340, 230, 360, 242], fill=(60, 30, 15))
            target_box = [195, 210, 405, 260]
            draw.rectangle(target_box, outline=(0, 150, 136), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 195, target_box[1]], fill=(0, 150, 136))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Cutting Weevil Clip: 92.8%", fill=(255, 255, 255))

        elif is_treated:
            # Treated: dried lesions coated with copper fungicide protective barrier
            dry_lesions = [(245, 240, 18), (355, 320, 22), (285, 440, 16)]
            for cx, cy, r in dry_lesions:
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(80, 50, 30))
                # Copper oxychloride turquoise barrier halo
                draw.ellipse([cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6], outline=(38, 166, 154), width=2)
            target_box = [355 - 45, 320 - 45, 355 + 45, 320 + 45]
            draw.rectangle(target_box, outline=(38, 166, 154), width=2)
            draw.rectangle([target_box[0], target_box[1] - 18, target_box[0] + 215, target_box[1]], fill=(38, 166, 154))
            draw.text((target_box[0] + 4, target_box[1] - 16), "Cu-Fungicide Barrier: Active", fill=(255, 255, 255))

        # Top HUD Bar
        draw.rectangle([0, 0, W, 48], fill=(18, 26, 36))
        draw.text((16, 8), f"MANGOBOT RAIL CV-INSPECTION | TREE: {tree_number}", fill=(255, 255, 255))
        badge_text = f"DIAGNOSIS: {disease_name.upper()}"
        if "anthracnose" in d_lower:
            badge_text += " (Colletotrichum gloeosporioides)"
            badge_color = (244, 143, 177)
        elif "powdery" in d_lower or "mildew" in d_lower:
            badge_text += " (Oidium mangiferae)"
            badge_color = (255, 213, 79)
        elif "canker" in d_lower or "bacterial" in d_lower:
            badge_text += " (Xanthomonas campestris)"
            badge_color = (255, 138, 101)
        elif "die" in d_lower and ("back" in d_lower or "dieback" in d_lower):
            badge_text += " (Lasiodiplodia theobromae)"
            badge_color = (255, 171, 145)
        elif "gall" in d_lower or "midge" in d_lower:
            badge_text += " (Procontarinia matteiana)"
            badge_color = (206, 147, 216)
        elif "sooty" in d_lower or "mould" in d_lower or "mold" in d_lower:
            badge_text += " (Meliola mangiferae)"
            badge_color = (176, 190, 197)
        elif "weevil" in d_lower or "cutting" in d_lower:
            badge_text += " (Deporaus marginatus)"
            badge_color = (128, 203, 196)
        elif is_treated:
            badge_text += " (Copper Oxychloride 50 WP Protective Film)"
            badge_color = (128, 222, 234)
        else:
            badge_text += " (Optimal Canopy Health)"
            badge_color = (129, 199, 132)
        draw.text((16, 26), badge_text, fill=badge_color)

        # Bottom Telemetry Bar
        draw.rectangle([0, H - 42, W, H], fill=(18, 26, 36))
        draw.text((16, H - 34), "SENSOR: Sony IMX477 12.3MP 4K NIR/RGB | RESOLUTION: 4056x3040", fill=(176, 190, 197))
        is_pathology = any(k in d_lower for k in ["anthracnose", "canker", "mildew", "powdery", "die", "midge", "sooty", "weevil"])
        draw.text(
            (16, H - 18),
            "STATUS: ANOMALY TELEMETRY SYNCHRONIZED" if is_pathology else ("STATUS: PROTECTIVE BARRIER VERIFIED" if is_treated else "STATUS: OPTIMAL VIGOR CONFIRMED"),
            fill=(255, 179, 0) if is_pathology else ((38, 166, 154) if is_treated else (76, 175, 80))
        )

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=92)
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

                # Determine disease profile based on tree state
                from app.models.tree import TreeHealthStatus
                if tree.health_status == TreeHealthStatus.DISEASE_DETECTED:
                    disease_hint = "Anthracnose"
                elif tree.health_status == TreeHealthStatus.TREATED:
                    disease_hint = "Treated"
                else:
                    disease_hint = "Healthy"

                leaf_bytes = self._generate_synthetic_leaf_bytes(tree.tree_number, disease_hint)
                saved_image = await image_service.upload_and_create(
                    db=db,
                    farm_id=farm.id,
                    tree_id=tree.id,
                    file_bytes=leaf_bytes,
                    filename=f"sim_leaf_{disease_hint.lower()}_r{state.current_row}_c{state.current_col}.jpg",
                    camera_id=camera.id,
                    image_type="SIMULATED_RGB_LEAF"
                )

                prediction = prediction_service.run_prediction_for_image(db, saved_image)
                
                # Automated Alert Trigger on Disease Detection
                if prediction.disease_name.lower() != "healthy":
                    from app.services.alert_service import alert_service
                    from app.models.alert import AlertSeverity, AlertType
                    severity = AlertSeverity.CRITICAL if prediction.confidence >= 0.90 else AlertSeverity.HIGH
                    alert_service.create_alert(
                        db=db,
                        farm_id=farm.id,
                        tree_id=tree.id,
                        camera_id=camera.id,
                        alert_type=AlertType.DISEASE_DETECTED,
                        severity=severity,
                        title=f"Pathogen Alert: {prediction.disease_name}",
                        message=f"Overhead rail inspection detected {prediction.disease_name} on {tree.tree_number} with {int(prediction.confidence*100)}% confidence."
                    )

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

    async def simulate_disease(
        self,
        camera_id: int,
        disease_name: str = "Anthracnose",
        tree_id: Optional[int] = None,
        severity: str = "HIGH",
        operator_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a targeted disease simulation on a specific tree or current camera tree.
        Generates realistic foliar pathology imagery, executes ML classification,
        creates high-priority pathogen alert, and updates tree diagnostics.
        """
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == camera_id).first()
            if not camera:
                return {"error": "Camera not found"}

            farm = db.query(Farm).filter(Farm.id == camera.farm_id).first()
            if not farm:
                return {"error": "Farm not found"}

            state = self._get_or_create_state(camera_id)

            # Target tree resolution
            if tree_id:
                tree = db.query(Tree).filter(Tree.id == tree_id, Tree.farm_id == farm.id).first()
            else:
                tree = db.query(Tree).filter(
                    Tree.farm_id == farm.id,
                    Tree.row_number == state.current_row,
                    Tree.column_number == state.current_col
                ).first()
                if not tree:
                    tree = db.query(Tree).filter(Tree.farm_id == farm.id).first()

            if not tree:
                return {"error": "Target tree not found"}

            # Move camera to this tree
            state.current_row = tree.row_number
            state.current_col = tree.column_number
            camera.current_tree_id = tree.id
            camera.current_row = tree.row_number
            camera.current_column = tree.column_number
            camera.status = CameraStatus.CAPTURING
            db.commit()

            # Mark tree status as DISEASE_DETECTED
            from app.models.tree import TreeHealthStatus
            tree.health_status = TreeHealthStatus.DISEASE_DETECTED
            db.commit()

            # Generate realistic diseased leaf image
            clean_disease_slug = disease_name.lower().replace(" ", "_")
            leaf_bytes = self._generate_synthetic_leaf_bytes(tree.tree_number, disease_name, severity)
            
            saved_image = await image_service.upload_and_create(
                db=db,
                farm_id=farm.id,
                tree_id=tree.id,
                file_bytes=leaf_bytes,
                filename=f"sim_leaf_{clean_disease_slug}_r{tree.row_number}_c{tree.column_number}.jpg",
                camera_id=camera.id,
                image_type="SIMULATED_PATHOLOGY_LEAF"
            )

            # Execute ML diagnostic pipeline
            prediction = prediction_service.run_prediction_for_image(db, saved_image)

            # Create High/Critical Pathogen Alert
            from app.services.alert_service import alert_service
            from app.models.alert import AlertSeverity, AlertType
            alert_sev = AlertSeverity.CRITICAL if severity.upper() == "HIGH" or prediction.confidence >= 0.90 else AlertSeverity.HIGH
            alert = alert_service.create_alert(
                db=db,
                farm_id=farm.id,
                tree_id=tree.id,
                camera_id=camera.id,
                alert_type=AlertType.DISEASE_DETECTED,
                severity=alert_sev,
                title=f"Pathogen Alert: {prediction.disease_name}",
                message=f"Overhead rail inspection detected {prediction.disease_name} on {tree.tree_number} with {int(prediction.confidence*100)}% confidence. {operator_notes or ''}".strip()
            )

            state.last_captured_image_id = saved_image.id
            state.last_prediction = {
                "id": prediction.id,
                "disease_name": prediction.disease_name,
                "confidence": prediction.confidence,
                "symptoms": prediction.symptoms,
                "treatment": prediction.treatment_recommendation,
                "is_mock": prediction.is_mock
            }
            state.last_event = f"Pathogen Detected on {tree.tree_number}: {prediction.disease_name} ({int(prediction.confidence*100)}%)"
            camera.status = CameraStatus.ONLINE
            db.commit()

            status_resp = self.get_status(db, camera_id)

            scientific_map = {
                "Anthracnose": "Colletotrichum gloeosporioides",
                "Bacterial Canker": "Xanthomonas campestris pv. mangiferaeindicae",
                "Powdery Mildew": "Oidium mangiferae",
                "Die Back": "Lasiodiplodia theobromae",
                "Gall Midge": "Procontarinia matteiana",
                "Sooty Mould": "Meliola mangiferae",
                "Cutting Weevil": "Deporaus marginatus",
                "Healthy": "Mangifera indica (Healthy)"
            }

            return {
                "camera_id": camera.id,
                "farm_id": farm.id,
                "tree_id": tree.id,
                "tree_number": tree.tree_number,
                "tree_health_status": tree.health_status.value if hasattr(tree.health_status, 'value') else tree.health_status,
                "disease_name": prediction.disease_name,
                "scientific_name": scientific_map.get(prediction.disease_name, "Colletotrichum gloeosporioides"),
                "confidence": prediction.confidence,
                "severity": severity,
                "symptoms": prediction.symptoms,
                "treatment_recommendation": prediction.treatment_recommendation,
                "image_id": saved_image.id,
                "image_url": f"/storage/{saved_image.file_path}",
                "alert_id": alert.id if alert else None,
                "alert_severity": alert.severity.value if (alert and hasattr(alert.severity, 'value')) else (alert.severity if alert else None),
                "simulation_status": status_resp
            }
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
