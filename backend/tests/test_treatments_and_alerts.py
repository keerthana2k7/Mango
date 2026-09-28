import pytest

def test_treatments_and_alerts_lifecycle(client):
    # 1. Fetch trees
    farms_res = client.get("/api/farms")
    assert farms_res.status_code == 200
    farms = farms_res.json()
    assert len(farms) >= 1
    farm_id = farms[0]["id"]

    trees_res = client.get(f"/api/farms/{farm_id}/trees")
    assert trees_res.status_code == 200
    trees = trees_res.json()
    assert len(trees) >= 1
    target_tree = trees[0]
    tree_id = target_tree["id"]

    # 2. Log treatment
    treatment_payload = {
        "tree_id": tree_id,
        "chemical_name": "Copper Oxychloride 50 WP (0.3%)",
        "dosage": "3g per Litre water",
        "operator_name": "Mithilesh Senior Agronomist",
        "treatment_type": "CHEMICAL",
        "notes": "Post-rain foliar spray for anthracnose prevention",
        "update_tree_health": True,
        "new_health_status": "TREATED"
    }
    treat_res = client.post("/api/treatments", json=treatment_payload)
    assert treat_res.status_code == 200
    treat_data = treat_res.json()
    assert treat_data["chemical_name"] == "Copper Oxychloride 50 WP (0.3%)"
    assert treat_data["tree_id"] == tree_id

    # 3. Verify tree health updated to TREATED
    tree_check = client.get(f"/api/trees/{tree_id}")
    assert tree_check.status_code == 200
    assert tree_check.json()["health_status"] == "TREATED"

    # 4. Fetch tree treatments
    tree_treats_res = client.get(f"/api/treatments/tree/{tree_id}")
    assert tree_treats_res.status_code == 200
    assert len(tree_treats_res.json()) >= 1

    # 5. Test Advisories endpoint
    adv_res = client.get("/api/advisories")
    assert adv_res.status_code == 200
    advisories = adv_res.json()
    assert len(advisories) >= 8
    names = [a["name"] for a in advisories]
    assert "Anthracnose" in names

    # 6. Test CSV Export endpoint
    csv_res = client.get(f"/api/analytics/export/csv?farm_id={farm_id}")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "Tree Number" in csv_res.text
