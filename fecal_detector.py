"""
PoulCare Fecal Disease Detection Engine
=======================================

A dedicated poultry *fecal* (droppings) classifier for the four primary
poultry diseases: Coccidiosis, Newcastle Disease (NCD), Salmonella and Healthy.

Unlike the lesion/object-detection engine (`predict.py` + `video_detector.py`),
which detects 26 clinical lesions on bird images/video, this module classifies a
single photograph of poultry droppings into one of the 4 primary conditions.

Model: MobileNetV3-Large (4-way classifier) trained on the
"Poultry Diseases Detection" dataset (Kaggle: kausthubkannan/poultry-diseases-detection,
originally Zenodo DOI 10.5281/zenodo.4628934).

The checkpoint `poultry_disease_model.pth` stores a dict with keys:
    model_state_dict, classes, val_acc, epoch
"""

import os
import io
import json
import argparse

import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image

MODEL_PATH = os.path.join(os.path.dirname(__file__), "poultry_disease_model.pth")
CLASS_MAPPING_PATH = os.path.join(os.path.dirname(__file__), "class_mapping.json")

CLASSES = ["cocci", "healthy", "ncd", "salmo"]

# ImageNet normalization used during training
NORMALIZE = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
TO_TENSOR = transforms.ToTensor()
INPUT_SIZE = 224

_MODEL_CACHE = None
_CLASS_META_CACHE = None


def _build_model(num_classes=4):
    """Reconstructs the exact MobileNetV3-Large architecture used in train.py."""
    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    return model


def load_fecal_model():
    """Loads (and caches) the fecal disease classifier."""
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Fecal model checkpoint not found at {MODEL_PATH}. "
            "Run `python train.py` with the poultry_diseases dataset first."
        )

    model = _build_model(num_classes=len(CLASSES))
    checkpoint = torch.load(MODEL_PATH, map_location="cpu")

    if "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    elif "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)
    model.eval()
    _MODEL_CACHE = model
    return model


def load_class_metadata():
    """Loads disease metadata (name, severity, symptoms, treatment) from class_mapping.json."""
    global _CLASS_META_CACHE
    if _CLASS_META_CACHE is not None:
        return _CLASS_META_CACHE

    with open(CLASS_MAPPING_PATH, "r") as f:
        raw = json.load(f)

    meta = {}
    for _, info in raw.items():
        meta[info["key"]] = {
            "name": info["name"],
            "severity": info["severity"],
            "description": info["description"],
            "symptoms": info["symptoms"],
            "treatment": info["treatment"],
        }
    _CLASS_META_CACHE = meta
    return meta


def _preprocess(image_input):
    """Normalizes any supported input (path / PIL / ndarray) into a (1,3,224,224) tensor."""
    if isinstance(image_input, str):
        img = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
    elif isinstance(image_input, np.ndarray):
        img = Image.fromarray(image_input[..., ::-1]).convert("RGB") if image_input.ndim == 3 else Image.fromarray(image_input).convert("RGB")
    else:
        raise ValueError("Unsupported image input type for fecal detection")

    img = img.resize((INPUT_SIZE, INPUT_SIZE), Image.Resampling.BILINEAR)
    return NORMALIZE(TO_TENSOR(img))


def _softmax_probs(logits):
    probs = torch.softmax(logits, dim=-1).detach().cpu().numpy().ravel()
    return probs


def predict_fecal(image_input, model=None, use_tta=True):
    """
    Predicts the fecal disease class for a droppings photo.

    Args:
        image_input: file path (str), PIL.Image, or numpy array (HxWx3).
        model: optional pre-loaded model (avoids reloading).
        use_tta: use light test-time augmentation (horizontal flip) for robustness.

    Returns a dict compatible with the diagnosis frontend:
        model_source, model_architecture, class_key, disease_name, severity,
        confidence_percentage, class_probabilities, description, symptoms,
        recommended_treatment
    """
    if model is None:
        model = load_fecal_model()

    tensor = _preprocess(image_input)
    meta = load_class_metadata()

    with torch.no_grad():
        if use_tta:
            flipped = torch.flip(tensor, dims=[2])
            batch = torch.stack([tensor, flipped], dim=0)
            logits = model(batch)
            probs = _softmax_probs(logits)
            probs = probs.reshape(2, -1).mean(axis=0)
        else:
            logits = model(tensor.unsqueeze(0))
            probs = _softmax_probs(logits)

    top_idx = int(np.argmax(probs))
    top_conf = float(probs[top_idx])
    class_key = CLASSES[top_idx]

    info = meta.get(class_key, meta.get("healthy", {}))

    class_probabilities = {
        cls: round(float(prob * 100.0), 2)
        for cls, prob in zip(CLASSES, probs)
    }

    return {
        "model_source": "PoulCare Fecal Diagnostic Engine",
        "model_architecture": "MobileNetV3-Large Classifier (4-way)",
        "class_key": class_key,
        "disease_name": info.get("name", class_key.capitalize()),
        "severity": info.get("severity", "None"),
        "confidence_percentage": round(top_conf * 100.0, 2),
        "class_probabilities": class_probabilities,
        "description": info.get("description", ""),
        "symptoms": info.get("symptoms", []),
        "recommended_treatment": info.get("treatment", []),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PoulCare Fecal Disease Predictor CLI")
    parser.add_argument("image_path", type=str, nargs="?", help="Path to a poultry droppings image")
    args = parser.parse_args()

    if args.image_path:
        res = predict_fecal(args.image_path)
        print(f"\n[+] PoulCare Fecal Diagnosis for {args.image_path}:")
        print(f"    Disease   : {res['disease_name']} ({res['severity']} severity)")
        print(f"    Confidence: {res['confidence_percentage']}%")
        print("    Class probabilities:")
        for cls, prob in res["class_probabilities"].items():
            print(f"      - {cls:8s} {prob}%")
    else:
        print("Usage: python fecal_detector.py <path_to_droppings_image.jpg>")
