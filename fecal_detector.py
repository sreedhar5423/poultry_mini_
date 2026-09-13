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

Fecal-image gate:
    Before classifying, the engine verifies the uploaded image actually looks
    like a fecal sample. Non-fecal images (birds, people, landscapes, documents,
    flat/solid images, ...) are rejected with `FecalImageError` so the user is
    asked to upload a droppings photo instead of getting a meaningless result.
    The gate combines:
      1. model confidence  (max softmax probability)
      2. prediction entropy (how spread-out the 4-class probabilities are)
      3. blue/purple color ratio (droppings are never blue/violet)
      4. image texture (flat/solid images carry no fecal detail)
    All thresholds are configurable (see `predict_fecal`).
"""

import os
import io
import json
import argparse

import numpy as np
import cv2
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

# Default validation thresholds (all configurable per-call / via env vars)
DEFAULT_THRESHOLDS = {
    "min_confidence": 0.55,          # reject if the top class is less confident than this
    "max_entropy": 0.62,             # reject if the probability spread is wider than this
    "max_nonfecal_hue_ratio": 0.30,  # reject if >30% pixels are saturated blue/purple
    "min_texture": 5.0,              # reject if image is too flat (Laplacian variance)
}

_MODEL_CACHE = None
_CLASS_META_CACHE = None


class FecalImageError(Exception):
    """Raised when the uploaded image does not look like a poultry fecal sample."""


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


def _to_bgr_array(image_input):
    """Converts any supported input (path / PIL / ndarray) into a BGR uint8 array."""
    if isinstance(image_input, str):
        img = Image.open(image_input).convert("RGB")
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    elif isinstance(image_input, np.ndarray):
        if image_input.ndim == 3 and image_input.shape[2] == 3:
            # assume BGR (OpenCV convention used across this project)
            return image_input.copy()
        else:
            img = Image.fromarray(image_input).convert("RGB")
            return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    else:
        raise ValueError("Unsupported image input type for fecal detection")


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


def _image_stats(img_np):
    """
    Computes auxiliary signals used to reject non-fecal images.

    Returns (texture, nonfecal_hue_ratio):
        texture            : Laplacian variance of the grayscale image (flat images ~0).
        nonfecal_hue_ratio : fraction of pixels with saturated blue/purple hues,
                             which never occur in poultry droppings.
    """
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    texture = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    hsv = cv2.cvtColor(img_np, cv2.COLOR_BGR2HSV).astype(np.int32)
    h = hsv[..., 0].ravel()
    s = hsv[..., 1].ravel()
    v = hsv[..., 2].ravel()

    nonfecal_mask = (h >= 105) & (h <= 170) & (s > 50) & (v > 50)
    nonfecal_ratio = float(nonfecal_mask.mean())

    return texture, nonfecal_ratio


def _resolve_thresholds(thresholds):
    resolved = dict(DEFAULT_THRESHOLDS)
    if thresholds:
        resolved.update(thresholds)
    # Env overrides (optional tuning without code changes)
    env_map = {
        "FECAL_MIN_CONFIDENCE": "min_confidence",
        "FECAL_MAX_ENTROPY": "max_entropy",
        "FECAL_MAX_NONFECAL_HUE": "max_nonfecal_hue_ratio",
        "FECAL_MIN_TEXTURE": "min_texture",
    }
    for env_key, key in env_map.items():
        val = os.environ.get(env_key)
        if val:
            try:
                resolved[key] = float(val)
            except ValueError:
                pass
    return resolved


def validate_fecal_image(img_np, probs, thresholds=None):
    """
    Checks whether the image is a plausible fecal sample.

    Returns (is_valid, reasons):
        is_valid: bool
        reasons : list[str] of human-readable rejection reasons (empty when valid).
    """
    th = _resolve_thresholds(thresholds)

    max_prob = float(probs.max())
    entropy = float(-(probs * np.log(probs + 1e-9)).sum() / np.log(len(probs)))
    texture, nonfecal_ratio = _image_stats(img_np)

    reasons = []
    if max_prob < th["min_confidence"]:
        reasons.append("the model is not confident this matches any known fecal disease class")
    if entropy > th["max_entropy"]:
        reasons.append("the prediction is too uncertain to be a real droppings sample")
    if nonfecal_ratio > th["max_nonfecal_hue_ratio"]:
        reasons.append("the image contains colors that do not occur in poultry droppings")
    if texture < th["min_texture"]:
        reasons.append("the image is too flat/uniform to be a real fecal photo")

    return len(reasons) == 0, reasons


def predict_fecal(image_input, model=None, use_tta=True, reject_non_fecal=True, thresholds=None):
    """
    Predicts the fecal disease class for a droppings photo.

    Args:
        image_input: file path (str), PIL.Image, or numpy array (HxWx3, BGR).
        model: optional pre-loaded model (avoids reloading).
        use_tta: use light test-time augmentation (horizontal flip) for robustness.
        reject_non_fecal: when True, raises `FecalImageError` if the image does
            not look like a fecal sample (see `validate_fecal_image`).
        thresholds: optional dict overriding the validation thresholds.

    Returns a dict compatible with the diagnosis frontend:
        model_source, model_architecture, class_key, disease_name, severity,
        confidence_percentage, class_probabilities, description, symptoms,
        recommended_treatment

    Raises:
        FecalImageError: if `reject_non_fecal` and the image fails validation.
    """
    if model is None:
        model = load_fecal_model()

    tensor = _preprocess(image_input)
    img_np = _to_bgr_array(image_input)
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

    if reject_non_fecal:
        is_valid, reasons = validate_fecal_image(img_np, probs, thresholds=thresholds)
        if not is_valid:
            raise FecalImageError(
                "This does not appear to be a poultry fecal (droppings) image. "
                "Please upload a clear, well-lit photo of poultry droppings for "
                "fecal disease detection. ("
                + "; ".join(reasons)
                + ")"
            )

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
        try:
            res = predict_fecal(args.image_path)
        except FecalImageError as e:
            print(f"\n[!] Rejected: {e}")
            raise SystemExit(1)

        print(f"\n[+] PoulCare Fecal Diagnosis for {args.image_path}:")
        print(f"    Disease   : {res['disease_name']} ({res['severity']} severity)")
        print(f"    Confidence: {res['confidence_percentage']}%")
        print("    Class probabilities:")
        for cls, prob in res["class_probabilities"].items():
            print(f"      - {cls:8s} {prob}%")
    else:
        print("Usage: python fecal_detector.py <path_to_droppings_image.jpg>")
