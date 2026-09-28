import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.core.database import SessionLocal
from app.models.tree import Tree
from app.models.camera import Camera
from app.models.prediction import Prediction
from app.models.alert import Alert
from app.services.simulation_service import simulation_engine

async def run_simulation_suite():
    print("=" * 70)
    print("🥭 MANGOBOT RAIL GANTRY - PATHOLOGY SIMULATION BENCHMARK")
    print("=" * 70)

    # 4 common mango leaf diseases to simulate
    target_diseases = [
        {
            "name": "Anthracnose",
            "pathogen": "Colletotrichum gloeosporioides",
            "severity": "HIGH",
            "notes": "Targeted apical necrosis simulation on vigorous canopy sector"
        },
        {
            "name": "Powdery Mildew",
            "pathogen": "Oidium mangiferae",
            "severity": "HIGH",
            "notes": "Superficial white powdery fungal mycelium expansion"
        },
        {
            "name": "Bacterial Canker",
            "pathogen": "Xanthomonas campestris pv. mangiferaeindicae",
            "severity": "HIGH",
            "notes": "Angular water-soaked lesions with chlorotic halos"
        },
        {
            "name": "Die Back",
            "pathogen": "Lasiodiplodia theobromae",
            "severity": "HIGH",
            "notes": "Descending branch drying and vascular necrosis"
        },
        {
            "name": "Gall Midge",
            "pathogen": "Procontarinia matteiana",
            "severity": "MEDIUM",
            "notes": "Foliar blister galls with exit pores on tender flushes"
        },
        {
            "name": "Sooty Mould",
            "pathogen": "Meliola mangiferae",
            "severity": "MEDIUM",
            "notes": "Velvety black fungal coating secondary to scale honeydew"
        }
    ]

    db = SessionLocal()
    try:
        trees = db.query(Tree).order_by(Tree.id).all()
        camera = db.query(Camera).first()
        if not camera:
            print("❌ No camera found in database.")
            return

        tree_records = [
            {"id": t.id, "tree_number": t.tree_number, "row": t.row_number, "col": t.column_number}
            for t in trees
        ]
        camera_id = camera.id
        print(f"📡 Using Robotic Overhead Camera Carriage: ID #{camera_id}")
        print(f"🌳 Available Trees: {len(tree_records)}")
        print("-" * 70)

        results = []
        for i, dis in enumerate(target_diseases):
            t_info = tree_records[i % len(tree_records)]
            print(f"🔬 Simulating: {dis['name']} on Tree {t_info['tree_number']} (Row {t_info['row']}, Col {t_info['col']})...")
            
            res = await simulation_engine.simulate_disease(
                camera_id=camera_id,
                disease_name=dis["name"],
                tree_id=t_info["id"],
                severity=dis["severity"],
                operator_notes=dis["notes"]
            )
            
            results.append(res)
            print(f"   ✅ Image Captured & Saved: {res['image_url']} (ID: {res['image_id']})")
            print(f"   🤖 ML Classification: {res['disease_name']} ({res['confidence'] * 100:.1f}% Confidence)")
            print(f"   🧬 Scientific Name: {res.get('scientific_name', 'N/A')}")
            print(f"   🩺 Symptoms: {res['symptoms']}")
            print(f"   💊 Rx / Treatment: {res['treatment_recommendation']}")
            print(f"   🚨 Alert Generated: #{res['alert_id']} [Severity: {res['alert_severity']}]")
            print(f"   📍 Camera Carriage Telemetry: X={res['simulation_status']['x']}m, Y={res['simulation_status']['y']}m, Progress={res['simulation_status']['progress_percentage']}%")
            print("-" * 70)

        print("\n📊 SIMULATION SUMMARY:")
        print(f"Total Diseases Simulated: {len(results)}")
        for r in results:
            print(f" • Tree {r['tree_number']}: {r['disease_name']} | Confidence: {r['confidence']*100:.1f}% | Alert #{r['alert_id']}")
        
        # Verify in database
        pred_count = db.query(Prediction).count()
        alert_count = db.query(Alert).count()
        print(f"\n📦 Database Status: {pred_count} Predictions, {alert_count} Alerts recorded.")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_simulation_suite())
