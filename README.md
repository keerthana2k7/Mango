# 🌿 MangoVision — Smart Mango Farm Disease Detection & Rail Scouting System

MangoVision is an intelligent agricultural monitoring and disease detection platform featuring a modular FastAPI backend, interactive React + TypeScript web dashboard, React Native Expo mobile application, real-time camera rail simulation engine, and leaf disease machine learning inference.

---

## Quick Start with Docker Compose

1. Clone the repository and navigate to the project directory:
   ```bash
   cd mango-farm-system
   ```

2. Start the complete system (PostgreSQL, FastAPI Backend, React Web Dashboard):
   ```bash
   docker-compose up --build
   ```

3. Open your browser:
   - **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **FastAPI OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Default Credentials**: `admin@mangovision.com` / `password123`

---

## Quick Start (Windows)

You can run both services together or individually using the helper scripts:
- **Run Full Stack**: Double-click `run_all.bat` or run `.\run_all.bat` in terminal.
- **Run Backend Only**: Run `.\run_backend.bat`
- **Run Frontend Only**: Run `.\run_web.bat`

---

## Local Development Setup

### 1. Backend (FastAPI)
Using the configured project virtual environment (`backend/venv`):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
Or directly:
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```


### 2. Web Application (React + Vite)
```bash
cd web
npm install
npm run dev
```

### 3. Mobile Application (React Native + Expo)
```bash
cd mobile
npm install
npx expo start
```

---

## Features

- **Interactive 2D Orchard Grid**: Real-time visual representation of tree rows, health states, and animated overhead camera carriage.
- **Automated Scouting Simulation**: Start, pause, stop, reset, and step deterministic camera rail traversal with live capture events.
- **AI Disease Classification**: Multi-class foliar diagnostics covering Anthracnose, Bacterial Canker, Powdery Mildew, Die Back, Gall Midge, Sooty Mould, Cutting Weevil, and Healthy.
- **SaaS Dashboard Design**: Inspired by modern minimalist dashboards with high-contrast metric cards, half-doughnut health gauge, and activity feed.
- **Hardware-Ready**: Clean abstractions for physical ESP32-CAM and stepper motor carriage deployment.
