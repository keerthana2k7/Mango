import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.ml.model_loader import model_loader
from app.api.auth import router as auth_router
from app.api.farms import router as farms_router
from app.api.trees import router as trees_router
from app.api.cameras import router as cameras_router
from app.api.simulation import router as simulation_router
from app.api.images import router as images_router
from app.api.predictions import router as predictions_router
from app.api.analytics import router as analytics_router
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models.farm import Farm
from app.models.tree import Tree, TreeHealthStatus
from app.models.camera import Camera, CameraStatus

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("mangovision")

def seed_initial_admin_and_farm():
    """Ensures at least one admin user and default farm exist on initial boot."""
    db = SessionLocal()
    try:
        # 1. Admin User
        admin_email = "admin@mangovision.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("password123"),
                full_name="Admin Mithilesh",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("Created default admin user: %s", admin_email)

        # 2. Default Farm & 24 trees (4 rows x 6 trees)
        farm = db.query(Farm).first()
        if not farm:
            farm = Farm(
                name="Salem Heritage Mango Orchard",
                location="Salem, Tamil Nadu, India",
                area_acres=5.5,
                total_rows=4,
                trees_per_row=6,
                description="High-density commercial orchard cultivating Alphonso & Banganapalli mango varieties with automated overhead rail scouting."
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)
            logger.info("Created default orchard: %s", farm.name)

            # Create 24 trees with realistic initial health states
            tree_health_distribution = [
                # Row 1 (Trees 1-6)
                TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.DISEASE_DETECTED, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY,
                # Row 2 (Trees 7-12)
                TreeHealthStatus.HEALTHY, TreeHealthStatus.DISEASE_DETECTED, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.UNKNOWN, TreeHealthStatus.HEALTHY,
                # Row 3 (Trees 13-18)
                TreeHealthStatus.DISEASE_DETECTED, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY,
                # Row 4 (Trees 19-24)
                TreeHealthStatus.HEALTHY, TreeHealthStatus.HEALTHY, TreeHealthStatus.UNKNOWN, TreeHealthStatus.HEALTHY, TreeHealthStatus.DISEASE_DETECTED, TreeHealthStatus.HEALTHY
            ]

            idx = 0
            for r in range(1, 5):
                for c in range(1, 7):
                    t = Tree(
                        farm_id=farm.id,
                        tree_number=f"T-R{r:02d}-C{c:02d}",
                        row_number=r,
                        column_number=c,
                        variety="Alphonso",
                        health_status=tree_health_distribution[idx]
                    )
                    db.add(t)
                    idx += 1
            db.commit()
            logger.info("Created 24 initial trees in orchard grid")

        # 3. Default Rail Camera
        camera = db.query(Camera).first()
        if not camera and farm:
            first_tree = db.query(Tree).filter(Tree.farm_id == farm.id, Tree.row_number == 1, Tree.column_number == 1).first()
            camera = Camera(
                farm_id=farm.id,
                name="Rail-Cam-01 (North Quadrant)",
                device_type="SIMULATED_RAIL_CAM",
                status=CameraStatus.ONLINE,
                current_row=1,
                current_column=1,
                current_tree_id=first_tree.id if first_tree else None,
                rail_position_meters=0.0,
                speed_m_per_s=1.2,
                battery_percentage=98.5
            )
            db.add(camera)
            db.commit()
            logger.info("Created default rail camera device")

    except Exception as e:
        logger.error("Error during initial database seeding: %s", e)
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB tables
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    seed_initial_admin_and_farm()

    # 2. Pre-load ML Model
    logger.info("Loading ML Disease Classification engine...")
    model_loader.load_model()
    
    # 3. Ensure storage directory
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_PATH, "images"), exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_PATH, "thumbnails"), exist_ok=True)

    yield

    logger.info("Shutting down MangoVision API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Mango Farm Disease Detection and Automated Rail Camera Scouting Platform",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for stored images
app.mount("/storage", StaticFiles(directory=settings.STORAGE_PATH), name="storage")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(farms_router, prefix=settings.API_V1_STR)
app.include_router(trees_router, prefix=settings.API_V1_STR)
app.include_router(cameras_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(images_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ml_mode": settings.ML_MODE,
        "ml_loaded": model_loader.is_loaded
    }
