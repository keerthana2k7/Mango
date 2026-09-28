import pytest

def test_camera_and_simulation_step(client):
    # Get cameras
    cams_res = client.get("/api/farms/1/cameras")
    assert cams_res.status_code == 200
    cams = cams_res.json()
    assert len(cams) >= 1
    camera_id = cams[0]["id"]

    # Check status
    stat_res = client.get(f"/api/cameras/{camera_id}/simulation/status")
    assert stat_res.status_code == 200
    data = stat_res.json()
    assert "current_row" in data
    assert "current_column" in data

    # Step simulation
    step_res = client.post(f"/api/cameras/{camera_id}/simulation/step")
    assert step_res.status_code == 200
    step_data = step_res.json()
    assert step_data["current_column"] >= 1
    assert step_data["last_captured_image_id"] is not None
    assert step_data["last_prediction"] is not None

def test_simulate_common_diseases(client):
    cams_res = client.get("/api/farms/1/cameras")
    assert cams_res.status_code == 200
    camera_id = cams_res.json()[0]["id"]

    for disease in ["Anthracnose", "Powdery Mildew", "Bacterial Canker", "Die Back"]:
        res = client.post(
            f"/api/cameras/{camera_id}/simulation/simulate-disease",
            json={"disease_name": disease, "severity": "HIGH"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["disease_name"] == disease
        assert data["confidence"] > 0.80
        assert data["image_id"] is not None
        assert data["alert_id"] is not None
        assert "simulation_status" in data
