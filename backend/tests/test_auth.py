def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data

def test_register_and_login(client):
    user_payload = {
        "email": "test_grower@mangovision.com",
        "full_name": "Test Grower",
        "password": "SecurePassword123!",
        "role": "FARM_MANAGER"
    }
    # Register
    reg_res = client.post("/api/auth/register", json=user_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == user_payload["email"].lower()

    # Login JSON
    login_res = client.post("/api/auth/login/json", json={
        "email": user_payload["email"],
        "password": user_payload["password"]
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data

    # Current user
    token = token_data["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == user_payload["email"].lower()
