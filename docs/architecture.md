# MangoVision System Architecture

## Overview
MangoVision is an intelligent smart-orchard disease detection and automated overhead rail camera scouting platform built as a **modular monolithic backend** with unified web and mobile client applications.

```
                         MangoVision Platform
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
         ▼                                                 ▼
   React + Vite                                   React Native Expo
  Web Dashboard                                  Mobile Application
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  │
                           REST API / JWT
                                  │
                      ┌───────────▼───────────┐
                      │    FastAPI Backend    │
                      │   (Modular Monolith)  │
                      └───────────┬───────────┘
                                  │
    ┌─────────────┬───────────────┼───────────────┬─────────────┐
    ▼             ▼               ▼               ▼             ▼
   Auth          Farm           Camera          Image          ML
  Module        Module          Module          Module       Module
                                  │                             │
                                  ▼                             ▼
                              Simulation                    Prediction
                                Engine                        Engine
                                  │                             │
    └─────────────┴───────────────┼───────────────┴─────────────┘
                                  │
                                  ▼
                         PostgreSQL Database
                                  │
                                  ▼
                            Storage Layer
```

## Architectural Tenets
1. **Single Backend**: One modular FastAPI backend serves both web and mobile clients.
2. **Deterministic Simulation Engine**: Camera movement and tree inspection state is managed exclusively by the backend state machine.
3. **Transparent ML Diagnostics**: Standardized model loading with external `classes.json` and explicit fallback handling.
4. **Hardware-Decoupled Design**: Abstracted drivers allow simulation to seamlessly transition to physical ESP32-CAM and motor rigs.
