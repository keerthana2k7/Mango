# Hardware Integration Guide (ESP32-CAM & Stepper Rail)

## Overview
MangoVision includes hardware driver abstractions located in `backend/app/hardware/`.

## Interface Contracts
- `CameraDeviceInterface`: Defines `capture_frame(target_id)` and `get_device_status()`.
- `MotorControllerInterface`: Defines `move_to_checkpoint(row, col)`, `set_speed(speed)`, and `home()`.

## Physical ESP32 Pinout & HTTP API
- **ESP32-CAM (AI-Thinker OV2640)**:
  - Flash LED: GPIO 4
  - Capture Trigger: `GET http://<ESP32_IP>/capture`
- **Stepper Driver (A4988 / TMC2209)**:
  - STEP: GPIO 18
  - DIR: GPIO 19
  - ENABLE: GPIO 21
  - Limit Switch (Home): GPIO 13

## Seamless Switch from Simulation to Hardware
To activate physical hardware, update the camera device type in the database or configuration:
```python
from app.hardware.esp32_adapter import ESP32CameraAdapter, ESP32MotorAdapter

# Instantiate physical adapters
camera_driver = ESP32CameraAdapter(ip_address="192.168.1.100")
motor_driver = ESP32MotorAdapter(ip_address="192.168.1.101")
```
No frontend, mobile, or REST endpoint modifications are required.
