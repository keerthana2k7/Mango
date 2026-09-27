import io
from typing import Tuple
from PIL import Image
import numpy as np

def load_and_preprocess_image(image_bytes: bytes, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Decodes raw image bytes, converts to RGB, resizes to target_size,
    and applies standard ImageNet mean/std normalization.
    Returns normalized float32 numpy array with shape (1, 3, H, W).
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(target_size, Image.Resampling.BILINEAR)
    
    # Convert to array [0, 1]
    img_array = np.array(image, dtype=np.float32) / 255.0
    
    # Standard normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = (img_array - mean) / std
    
    # Transpose to (C, H, W) and add batch dim -> (1, C, H, W)
    img_tensor = np.transpose(img_array, (2, 0, 1))
    img_tensor = np.expand_dims(img_tensor, axis=0)
    return img_tensor
