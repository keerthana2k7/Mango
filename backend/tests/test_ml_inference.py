from app.ml.inference import inference_engine

def test_ml_mock_prediction():
    fake_bytes = b"fake-mango-leaf-image-content"
    diag = inference_engine.predict(fake_bytes, filename="leaf_anthracnose_sample.jpg")
    assert "disease_name" in diag
    assert "confidence" in diag
    assert diag["confidence"] >= 0.0 and diag["confidence"] <= 1.0
    assert diag["is_mock"] is True
    assert diag["symptoms"] is not None
