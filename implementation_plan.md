# MangoVision: Architecture Review, Restructuring & Implementation Plan

---

## 1. Architecture Review & Analysis

| Existing / Proposed Pattern | Identified Risk / Problem | Recommended Change | Rationale |
| :--- | :--- | :--- | :--- |
| **Database Strategy (Automatic SQLite Fallback)** | Running PostgreSQL in production but falling back dynamically to SQLite in code introduces dialect mismatches (JSON types, foreign key behaviors, concurrent lock handling, sequence generation). | **Strict Single Database Strategy**: Use **PostgreSQL** exclusively for development, staging, and production via Docker / local config. Isolate SQLite strictly to standalone `pytest` test runners if needed. | Ensures database constraints, relationships, schema migrations, and concurrency behave identically in all environments. |
| **ML Inference & Model Weight Handling** | Previous plan mentioned "synthetic fallback weights" that could simulate real models or obscure whether an actual model is loaded. | **Explicit `ML_MODE` & Metadata Config**: Load model from `MODEL_PATH` with external `model_config.json` & `classes.json`. If unavailable, use explicit `ML_MODE=mock` with clear `is_mock: true` flag in the payload. | Avoids hard-coded class orderings and ensures true ML provenance with complete transparency. |
| **Camera Simulation Authority** | Risk of frontend calculating coordinates independently, leading to state desynchronization between Web, Mobile, and Backend. | **FastAPI Simulation Engine as Single Source of Truth**: The backend manages the camera state machine (`IDLE`, `RUNNING`, `PAUSED`, `CAPTURING`, `STOPPED`, `ERROR`), tick loop, position math, and capture triggers. | Web and Mobile clients simply poll/render backend telemetry without duplicate simulation math. |
| **Real-Time Communication Layer** | Prematurely adding WebSockets or Redis Pub/Sub adds infrastructure overhead, connection drop handling, and complexity. | **Polled REST API First**: Use standard `GET /api/cameras/{id}/simulation/status` (1-2s poll). WebSockets can be an optional enhancement later if needed. | Reliable, trivial to test, works seamlessly across both Web and Expo Mobile without connection fragility. |
| **Hardware Abstraction** | Coupling camera endpoints directly to simulated loops makes future ESP32 integration difficult. | **Clean Interface Abstraction**: `CameraInterface` and `MotorControllerInterface` with `SimulationEngine` and future `ESP32Controller` adapters. | Enables physical ESP32 and motor hardware to plug in seamlessly without touching core APIs or database schemas. |
| **Mobile & Web Scope Overlap** | Recreating all desktop administrative workflows on mobile clutters the UI and slows development. | **Differentiated User Journeys**: Web focuses on deep management, visualization, analytics, and data administration; Expo Mobile focuses on field inspection, quick camera control, and rapid tree diagnostic views. | Maximizes UX efficiency on each platform while consuming identical FastAPI endpoints. |

---

## 2. Final Target Architecture Diagram

```
                                  MANGOVISION SYSTEM
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
          React + Vite Web App                           React Native Expo Mobile
      (Emerald SaaS Admin Dashboard)                      (Field Inspection App)
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                   REST API (JSON)
                                 JWT Bearer Auth
                                          │
                        ┌─────────────────▼─────────────────┐
                        │          FastAPI Backend          │
                        │        (Modular Monolith)         │
                        └─────────────────┬─────────────────┘
                                          │
    ┌──────────────┬──────────────┬───────┴──────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼              ▼
 ┌──────┐      ┌──────┐      ┌────────┐     ┌────────┐     ┌────────┐    ┌───────────┐
 │ Auth │      │ Farm │      │ Camera │     │ Image  │     │   ML   │    │ Analytics │
 │Module│      │Module│      │ Module │     │ Module │     │ Module │    │  Module   │
 └──────┘      └──────┘      └────┬───┘     └───┬────┘     └───┬────┘    └───────────┘
                                  │             │              │
                                  ▼             │              ▼
                           ┌──────────────┐     │      ┌───────────────┐
                           │  Simulation  │     │      │  Prediction   │
                           │    Engine    │     │      │    Engine     │
                           └──────┬───────┘     │      └───────┬───────┘
                                  │ (Capture)   │              │
                                  └─────────────►──────────────┘
                                                │
                                  ┌─────────────┴─────────────┐
                                  ▼                           ▼
                         ┌─────────────────┐         ┌─────────────────┐
                         │   PostgreSQL    │         │  Storage Layer  │
                         │   (SQLAlchemy)  │         │ (Local FS / S3) │
                         └─────────────────┘         └─────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │ Future Hardware Layer   │
                     │ (ESP32-CAM / Stepper)   │
                     └─────────────────────────┘
```

---

## 3. Final Repository & Project Structure

```text
mango-farm-system/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application factory & lifespan
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic Settings & env management
│   │   │   ├── database.py             # SQLAlchemy session & Base engine
│   │   │   └── security.py             # Bcrypt hashing & JWT token handling
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # User & Role ORM model
│   │   │   ├── farm.py                 # Farm ORM model
│   │   │   ├── tree.py                 # Tree & Health ORM model
│   │   │   ├── camera.py               # Camera & Rail ORM model
│   │   │   ├── image.py                # Image metadata ORM model
│   │   │   └── prediction.py           # ML Disease Prediction ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # Auth & User Pydantic schemas
│   │   │   ├── farm.py                 # Farm request/response schemas
│   │   │   ├── tree.py                 # Tree coordinate schemas
│   │   │   ├── camera.py               # Camera & telemetry schemas
│   │   │   ├── simulation.py           # Simulation command & state schemas
│   │   │   ├── image.py                # Upload & image metadata schemas
│   │   │   ├── prediction.py           # Diagnostic output schemas
│   │   │   └── analytics.py            # Dashboard aggregate schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                 # DB sessions & JWT auth dependencies
│   │   │   ├── auth.py                 # /api/auth
│   │   │   ├── farms.py                # /api/farms
│   │   │   ├── trees.py                # /api/trees
│   │   │   ├── cameras.py              # /api/cameras
│   │   │   ├── simulation.py           # /api/simulation & /api/cameras/{id}/simulation
│   │   │   ├── images.py               # /api/images
│   │   │   ├── predictions.py          # /api/predictions
│   │   │   └── analytics.py            # /api/analytics
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── farm_service.py
│   │   │   ├── tree_service.py
│   │   │   ├── camera_service.py
│   │   │   ├── simulation_service.py   # State machine, path math & capture trigger
│   │   │   ├── storage_service.py      # Abstracted local disk / S3 storage
│   │   │   ├── image_service.py
│   │   │   ├── prediction_service.py
│   │   │   └── analytics_service.py
│   │   ├── ml/
│   │   │   ├── model_loader.py         # Singleton model lifecycle manager
│   │   │   ├── preprocessing.py        # Image transforms (224x224, tensor normalize)
│   │   │   ├── inference.py            # PyTorch / ONNX model execution
│   │   │   ├── model_config.json       # Input size, normalization parameters
│   │   │   ├── classes.json            # Dynamic disease label mappings
│   │   │   └── weights/                # Model weight storage directory
│   │   └── hardware/
│   │       ├── base.py                 # Abstract Camera & Controller interfaces
│   │       ├── simulation_adapter.py   # Simulated camera & rail driver
│   │       └── esp32_adapter.py        # Hardware driver stub for future deployment
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_farms.py
│   │   ├── test_trees.py
│   │   ├── test_camera_simulation.py
│   │   ├── test_images.py
│   │   ├── test_ml_inference.py
│   │   └── test_analytics.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
│
├── web/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/                 # Button, Input, Modal, Badge, Card, Table
│   │   │   ├── layout/                 # Sidebar, TopBar, DashboardLayout
│   │   │   ├── dashboard/              # MetricCards, FarmHeroCard, HealthGauge, ActivityFeed
│   │   │   ├── farm/                   # FarmCanvas2D, TreeMarker, CameraCarriage, TreeDrawer
│   │   │   ├── camera/                 # CameraControlBar, SpeedSlider, TelemetryDisplay
│   │   │   ├── predictions/            # PredictionTable, DiseaseTag, ConfidenceBar
│   │   │   └── images/                 # ImageGrid, ImageLightbox, DetectionOverlay
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── FarmsPage.tsx
│   │   │   ├── FarmDetailPage.tsx
│   │   │   ├── TreesPage.tsx
│   │   │   ├── TreeDetailPage.tsx
│   │   │   ├── CamerasPage.tsx
│   │   │   ├── SimulationPage.tsx
│   │   │   ├── PredictionsPage.tsx
│   │   │   ├── ImageGalleryPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts                  # Axios client with JWT interceptor
│   │   │   ├── authService.ts
│   │   │   ├── farmService.ts
│   │   │   ├── cameraService.ts
│   │   │   ├── simulationService.ts
│   │   │   └── predictionService.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSimulation.ts        # Polling & animation state hook
│   │   │   └── useFarmData.ts
│   │   ├── types/                      # TypeScript schemas mirroring backend
│   │   ├── styles/
│   │   │   └── index.css               # Design tokens (Emerald & Reference UI styling)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx                 # Root providers (Auth, Theme)
│   │   ├── (auth)/
│   │   │   └── login.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx             # Bottom tab navigator
│   │   │   ├── index.tsx               # Mobile Home Overview
│   │   │   ├── farm.tsx                # Mobile 2D Farm Grid & Tree Inspector
│   │   │   ├── camera.tsx              # Mobile Camera Simulation Controller
│   │   │   ├── predictions.tsx         # Mobile Disease Prediction History
│   │   │   └── profile.tsx             # User profile & logout
│   │   └── tree/
│   │       └── [id].tsx                # Tree details & image gallery modal
│   ├── components/
│   │   ├── MobileMetricCard.tsx
│   │   ├── MobileFarmView.tsx
│   │   ├── MobileCameraControls.tsx
│   │   ├── TreeDetailSheet.tsx
│   │   └── StatusPill.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── authStorage.ts              # Secure token persistence
│   │   └── mobileServices.ts
│   ├── types/
│   ├── app.json
│   └── package.json
│
├── database/
│   ├── seed/
│   │   └── seed_data.py                # 24-tree Salem orchard sample data & sample leaves
│   └── migrations/
│
├── postman/
│   └── Mango-Farm-API.postman_collection.json
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── ml-inference.md
│   ├── camera-simulation.md
│   ├── web.md
│   ├── mobile.md
│   ├── deployment.md
│   └── hardware-integration.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 4. Final Database Schema (PostgreSQL / SQLAlchemy)

```
┌──────────────────┐       1:N       ┌──────────────────┐       1:N       ┌──────────────────┐
│      farms       ├────────────────►│      trees       ├────────────────►│   predictions    │
│──────────────────│                 │──────────────────│                 │──────────────────│
│ id (PK)          │                 │ id (PK)          │                 │ id (PK)          │
│ name             │                 │ farm_id (FK)     │                 │ tree_id (FK)     │
│ location         │                 │ tree_number      │                 │ image_id (FK)    │
│ area_acres       │                 │ row_number       │                 │ disease_name     │
│ total_rows       │                 │ column_number    │                 │ confidence       │
│ trees_per_row    │                 │ latitude         │                 │ model_version    │
│ created_at       │                 │ longitude        │                 │ prediction_time  │
│ updated_at       │                 │ health_status    │                 └──────────────────┘
└────────┬─────────┘                 │ last_inspected_at│                          ▲
         │                           └────────┬─────────┘                          │
         │ 1:N                                │ 1:N                                │
         ▼                                    ▼                                    │
┌──────────────────┐       1:N       ┌──────────────────┐                          │
│     cameras      ├────────────────►│      images      ├──────────────────────────┘
│──────────────────│                 │──────────────────│
│ id (PK)          │                 │ id (PK)          │
│ farm_id (FK)     │                 │ farm_id (FK)     │
│ name             │                 │ tree_id (FK)     │
│ device_type      │                 │ camera_id (FK)   │
│ status           │                 │ file_path        │
│ current_row      │                 │ image_type       │
│ current_tree_id  │                 │ capture_time     │
│ rail_position_m  │                 │ processing_status│
│ speed_m_per_s    │                 └──────────────────┘
│ updated_at       │
└──────────────────┘
```

### Table Definitions & Constraints

1. **`users`**:
   - `id`: UUID / Integer PK
   - `email`: VARCHAR(255) UNIQUE, NOT NULL, INDEX
   - `hashed_password`: VARCHAR(255), NOT NULL
   - `full_name`: VARCHAR(255), NOT NULL
   - `role`: ENUM (`ADMIN`, `FARM_MANAGER`, `OPERATOR`), DEFAULT `FARM_MANAGER`
   - `is_active`: BOOLEAN, DEFAULT `true`
   - `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE

2. **`farms`**:
   - `id`: UUID / Integer PK
   - `name`: VARCHAR(255), NOT NULL
   - `location`: VARCHAR(255), NOT NULL
   - `area_acres`: FLOAT, NOT NULL
   - `total_rows`: INT NOT NULL DEFAULT 4
   - `trees_per_row`: INT NOT NULL DEFAULT 6
   - `description`: TEXT NULL
   - `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE

3. **`trees`**:
   - `id`: UUID / Integer PK
   - `farm_id`: FK $\to$ `farms.id` (ON DELETE CASCADE), INDEX
   - `tree_number`: VARCHAR(50) NOT NULL
   - `row_number`: INT NOT NULL (1-indexed)
   - `column_number`: INT NOT NULL (1-indexed)
   - `latitude`: FLOAT NULL
   - `longitude`: FLOAT NULL
   - `health_status`: ENUM (`HEALTHY`, `DISEASE_DETECTED`, `UNKNOWN`), DEFAULT `UNKNOWN`, INDEX
   - `last_inspected_at`: TIMESTAMP WITH TIME ZONE NULL
   - `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE
   - *Constraint*: UNIQUE (`farm_id`, `row_number`, `column_number`)

4. **`cameras`**:
   - `id`: UUID / Integer PK
   - `farm_id`: FK $\to$ `farms.id` (ON DELETE CASCADE), INDEX
   - `name`: VARCHAR(100) NOT NULL
   - `device_type`: VARCHAR(50) DEFAULT `SIMULATED_RAIL_CAM`
   - `status`: ENUM (`ONLINE`, `OFFLINE`, `MOVING`, `CAPTURING`, `ERROR`), DEFAULT `ONLINE`
   - `current_row`: INT DEFAULT 1
   - `current_column`: INT DEFAULT 1
   - `current_tree_id`: FK $\to$ `trees.id` NULL
   - `rail_position_meters`: FLOAT DEFAULT 0.0
   - `speed_m_per_s`: FLOAT DEFAULT 1.0
   - `created_at`, `updated_at`: TIMESTAMP WITH TIME ZONE

5. **`images`**:
   - `id`: UUID / Integer PK
   - `farm_id`: FK $\to$ `farms.id` (ON DELETE CASCADE), INDEX
   - `tree_id`: FK $\to$ `trees.id` (ON DELETE CASCADE), INDEX
   - `camera_id`: FK $\to$ `cameras.id` (ON DELETE SET NULL), INDEX
   - `file_path`: VARCHAR(500) NOT NULL
   - `capture_time`: TIMESTAMP WITH TIME ZONE NOT NULL
   - `image_type`: VARCHAR(50) DEFAULT `RGB_LEAF`
   - `processing_status`: ENUM (`PENDING`, `PROCESSED`, `FAILED`), DEFAULT `PENDING`
   - `created_at`: TIMESTAMP WITH TIME ZONE

6. **`predictions`**:
   - `id`: UUID / Integer PK
   - `image_id`: FK $\to$ `images.id` (ON DELETE CASCADE), UNIQUE, INDEX
   - `tree_id`: FK $\to$ `trees.id` (ON DELETE CASCADE), INDEX
   - `disease_name`: VARCHAR(100) NOT NULL
   - `confidence`: FLOAT NOT NULL
   - `class_id`: INT NOT NULL
   - `model_version`: VARCHAR(50) NOT NULL
   - `prediction_time`: TIMESTAMP WITH TIME ZONE NOT NULL

---

## 5. Final API List (Grouped by Module)

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user (admin/manager)
- `POST /api/auth/login` — OAuth2 compatible JWT login
- `GET  /api/auth/me` — Retrieve current authenticated user profile

### Farms (`/api/farms`)
- `GET    /api/farms` — List all farms (with tree count and health overview)
- `POST   /api/farms` — Create a new farm
- `GET    /api/farms/{farm_id}` — Get farm details & grid layout parameters
- `PUT    /api/farms/{farm_id}` — Update farm details
- `DELETE /api/farms/{farm_id}` — Remove farm

### Trees (`/api/trees`, `/api/farms/{farm_id}/trees`)
- `GET    /api/farms/{farm_id}/trees` — Get full tree grid for a farm
- `POST   /api/farms/{farm_id}/trees` — Add a tree to a farm
- `GET    /api/trees/{tree_id}` — Get tree details, health, and latest prediction
- `PUT    /api/trees/{tree_id}` — Update tree coordinates/health manually

### Cameras & Simulation (`/api/cameras`, `/api/simulation`)
- `GET    /api/farms/{farm_id}/cameras` — List cameras assigned to farm
- `POST   /api/farms/{farm_id}/cameras` — Register a new camera
- `GET    /api/cameras/{camera_id}` — Get camera status & telemetry
- `PUT    /api/cameras/{camera_id}` — Update camera settings
- `GET    /api/cameras/{camera_id}/simulation/status` — Get real-time simulation position, speed, and state
- `POST   /api/cameras/{camera_id}/simulation/start` — Start camera traversal along rail
- `POST   /api/cameras/{camera_id}/simulation/pause` — Pause simulation
- `POST   /api/cameras/{camera_id}/simulation/stop` — Stop simulation
- `POST   /api/cameras/{camera_id}/simulation/reset` — Reset camera to start of rail
- `POST   /api/cameras/{camera_id}/simulation/step` — Advance simulation deterministically by 1 step

### Images (`/api/images`)
- `POST   /api/images/upload` — Upload leaf image file (multipart/form-data)
- `GET    /api/images/{image_id}` — Get image metadata
- `GET    /api/trees/{tree_id}/images` — Get image history for a specific tree

### Predictions (`/api/predictions`)
- `POST   /api/predictions` — Trigger ML inference on an uploaded image
- `GET    /api/predictions/{prediction_id}` — Get detailed disease diagnosis
- `GET    /api/trees/{tree_id}/predictions` — Get prediction timeline for a tree

### Analytics (`/api/analytics`)
- `GET    /api/analytics/dashboard?farm_id={id}` — Aggregate summary: total trees, health breakdown, disease distribution, camera health

---

## 6. UI/UX Design System (Translating References 1, 2, 3)

### Visual Foundations
- **Background & Card Canvas**:
  - Outer background: `#F4F7F5` (subtle off-white with warm/green tint)
  - Dashboard container: `#FFFFFF` floating canvas with `24px` rounded outer borders and soft multi-layer shadow (`0 20px 40px -15px rgba(0, 0, 0, 0.05)`).
  - Cards: `16px` border-radius (`rounded-2xl`), crisp `#E5EAE7` borders, `#FAFCFB` secondary card backgrounds.
- **Color Tokens**:
  - `primary-dark`: `#064E3B` (Forest Green)
  - `primary-emerald`: `#059669`
  - `primary-light`: `#10B981`
  - `accent-green`: `#ECFDF5`
  - `status-healthy`: `#10B981` (Green)
  - `status-disease`: `#EF4444` (Red / Coral)
  - `status-warning`: `#F59E0B` (Amber)
  - `status-unknown`: `#9CA3AF` (Slate)
- **Typography**: Inter / Plus Jakarta Sans. Large metric numbers (`32px`, font-weight 700), clean uppercase tracked category badges.

### Core UI Components
1. **Left Sidebar (Inspired by Reference 1 & 3)**:
   - Brand header: `🌿 MangoVision` with subtitle `Smart Farm Platform`.
   - Navigation links with active green vertical accent pill and emerald background tint.
   - Bottom CTA card: "Download Mobile App" with QR code/download badge (Reference 3).
2. **Top Bar**:
   - Quick search input (`⌘K`), Farm Selector dropdown, Live Simulation status pill (`● 1 Camera Active`), Notification bell, User avatar.
3. **Hero Component — 2D Interactive Farm Canvas**:
   - Visual orchard layout with tree rows, rail lines, and an animated camera carriage gliding smoothly across the rail.
   - Interactive tree markers indicating health status with real-time inspection pulse effects.
   - Live control toolbar with Play, Pause, Step, Reset buttons, and speed slider.
4. **Analytics Cards (Inspired by Reference 1 & 2)**:
   - Half-doughnut gauge for overall farm health % (Reference 1 & 3).
   - Disease distribution rounded bar chart (Reference 1).
   - Activity feed with inspection timestamps and disease labels.

---

## 7. Implementation Phases (Step-by-Step Order)

- **Phase 0 — Architecture Review & Alignment**: Review references, finalize schemas, directory layout, and design system.
- **Phase 1 — Backend Foundation**: Initialize FastAPI, SQLAlchemy, Alembic, PostgreSQL connection, configuration, health check endpoint.
- **Phase 2 — Authentication Module**: User model, JWT issuance, password hashing, roles, `/api/auth` endpoints and unit tests.
- **Phase 3 — Farm & Tree Grid Modules**: Farm & Tree models, grid generation logic, health status management, database seeder with 24-tree Salem farm.
- **Phase 4 — Camera & Simulation Engine**: Camera model, state machine, tick calculation, checkpoint triggers, deterministic step API.
- **Phase 5 — Storage & Image Pipeline**: Storage service (local filesystem abstraction), image upload endpoint, static image delivery.
- **Phase 6 — ML Inference Engine**: Preprocessing pipeline, model loader, `classes.json`, inference execution, mock fallback mode.
- **Phase 7 — End-to-End Backend Workflow**: Connect simulation tick $\to$ image capture $\to$ ML inference $\to$ prediction record $\to$ tree health update.
- **Phase 8 — React Web Application**: Vite + React + TypeScript setup, Tailwind/custom CSS design system, sidebar, topbar, dashboard pages.
- **Phase 9 — Web Farm Visualization**: Interactive 2D Farm Canvas, animated camera carriage, simulation controller bar, tree inspection modal.
- **Phase 10 — React Native Expo Mobile App**: Expo Router setup, shared API layer, mobile dashboard, touch-friendly farm grid, camera control screen.
- **Phase 11 — End-to-End Integration & Verification**: Cross-platform verification (Web + Mobile + Backend + Simulation + ML).
- **Phase 12 — Docker Compose, Postman Suite & Documentation**: Final containerization, Postman collection with tests, and comprehensive `docs/`.

---

## 8. Risk Management & Mitigations

1. **ML Model Availability / Execution Risk**:
   - *Mitigation*: Modular `ML_MODE=model|mock` architecture. Dynamic `classes.json` configuration ensures no hard-coded label orderings.
2. **Simulation State Desynchronization**:
   - *Mitigation*: Backend is the single source of truth. Frontend and mobile only read and visualize state from REST polling.
3. **Mobile API Connectivity (CORS & IP Routing)**:
   - *Mitigation*: FastAPI configured with permissive development CORS. Expo app uses configurable `EXPO_PUBLIC_API_BASE_URL` with network error handling.
4. **Image Storage Scalability**:
   - *Mitigation*: Abstracted `StorageService` interface decoupling disk I/O from API routes, enabling seamless S3/MinIO transition later.
5. **Future ESP32 Hardware Integration**:
   - *Mitigation*: Clean `CameraInterface` and `MotorControllerInterface` decouple software simulation from physical hardware drivers.

---

## Verification Plan

### Automated Testing
- `backend`: Execute full `pytest` suite covering auth, farm CRUD, simulation state transitions, image upload, and prediction triggers.
- `web`: Run `npm run build` and verify type correctness.
- `mobile`: Verify TypeScript compilation and Expo Router route structure.

### Manual Verification
1. Log in via Web Dashboard (`admin@mangovision.com` / `password123`).
2. Start Camera Simulation on Dashboard.
3. Observe real-time camera traversal, automated image capture, and ML disease detection updating the tree grid.
4. Open Expo Mobile App and verify synchronized farm health state and live camera position.
