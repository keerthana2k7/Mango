def test_list_and_create_farms(client):
    # List farms (seeded farm should be present)
    res = client.get("/api/farms")
    assert res.status_code == 200
    farms = res.json()
    assert len(farms) >= 1
    farm_id = farms[0]["id"]

    # Get trees for farm
    trees_res = client.get(f"/api/farms/{farm_id}/trees")
    assert trees_res.status_code == 200
    trees = trees_res.json()
    assert len(trees) == 24  # 4 rows x 6 columns
    assert trees[0]["row_number"] == 1
    assert trees[0]["column_number"] == 1

def test_farm_layout(client):
    res = client.get("/api/farms/1/layout")
    assert res.status_code == 200
    layout = res.json()
    assert layout["farm_id"] == 1
    assert "dimensions" in layout
    assert layout["dimensions"]["width_meters"] > 0
    assert layout["dimensions"]["height_meters"] > 0
    assert len(layout["boundary"]) == 4
    assert len(layout["rows"]) == 4
    assert len(layout["rows"][0]["trees"]) == 6
    assert layout["rows"][0]["trees"][0]["x"] == 15.0
    assert layout["rows"][0]["trees"][0]["y"] == 16.0
    assert len(layout["camera_paths"]) >= 1
    assert len(layout["camera_paths"][0]["points"]) == 24

