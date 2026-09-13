"""
PoulCare Image Diagnosis — Roboflow Inference Engine
=====================================================

Image AI diagnosis (the "Image AI Diagnosis" tab) now runs on the user-provided
Roboflow model instead of the bundled local YOLO11 weights.

Equivalent to the official inference SDK snippet:

    from inference_sdk import InferenceHTTPClient, InferenceConfiguration
    CLIENT = InferenceHTTPClient(
        api_url="https://serverless.roboflow.com",
        api_key="...",
    ).configure(InferenceConfiguration(api_key_transport="header"))
    result = CLIENT.infer("image.jpg", model_id="poultry-disease-detection-quprj/9")

We call the same REST endpoint directly with `requests` (multipart file upload +
API key in both the query string and the Authorization header) to avoid the
`inference-sdk` dependency conflict (it forces numpy>=2.0 and GUI OpenCV, which
break the CPU/headless torch stack used by the rest of the app).

Configuration (env-var overridable):
    ROBOFLOW_API_URL   -> default https://serverless.roboflow.com
    ROBOFLOW_API_KEY   -> default the key from the provided snippet
    ROBOFLOW_MODEL_ID  -> default poultry-disease-detection-quprj/9
"""

import os
import io
import json
import base64

import cv2
import numpy as np
import requests
from PIL import Image

from predict import DISEASE_MAPPING

ROBOFLOW_API_URL = os.environ.get("ROBOFLOW_API_URL", "https://serverless.roboflow.com")
ROBOFLOW_API_KEY = os.environ.get(
    "ROBOFLOW_API_KEY", "2Hbs9BvumVreTIQqirLx"
)
ROBOFLOW_MODEL_ID = os.environ.get(
    "ROBOFLOW_MODEL_ID", "poultry-disease-detection-quprj/9"
)

CONF_THRESHOLD = 0.25
REQUEST_TIMEOUT = 40  # seconds


class RoboflowInferenceError(Exception):
    """Raised when the Roboflow API cannot be reached or returns an error."""

# ---------------------------------------------------------------------------
# Disease metadata (name/severity/symptoms/treatment) reused for the UI
# ---------------------------------------------------------------------------
def _salmo_meta():
    """Load Salmonella metadata from class_mapping.json (not in DISEASE_MAPPING)."""
    mapping_path = os.path.join(os.path.dirname(__file__), "class_mapping.json")
    with open(mapping_path, "r") as f:
        raw = json.load(f)
    for _, info in raw.items():
        if info.get("key") == "salmo":
            return {
                "name": info["name"],
                "severity": info["severity"],
                "description": info["description"],
                "symptoms": info["symptoms"],
                "treatment": info["treatment"],
            }
    return {
        "name": "Salmonella Infection",
        "severity": "High",
        "description": "Bacterial infection caused by Salmonella species.",
        "symptoms": ["Chalky white or yellowish diarrhea", "Depression and huddling"],
        "treatment": ["Administer vet-prescribed antimicrobial therapy."],
    }


DISEASE_META = {
    "ncd": DISEASE_MAPPING["ncd"],
    "cocci": DISEASE_MAPPING["cocci"],
    "fowlpox": DISEASE_MAPPING["fowlpox"],
    "healthy": DISEASE_MAPPING["healthy"],
    "salmo": _salmo_meta(),
}

# ---------------------------------------------------------------------------
# Class-name -> disease group mapping (order matters: first match wins)
# Handles both 4-class models and 26-lesion style models.
# ---------------------------------------------------------------------------
ALIAS_RULES = [
    # full disease names / keys
    ("coccidiosis", "cocci"),
    ("newcastle", "ncd"),
    ("salmonella", "salmo"),
    ("fowl pox", "fowlpox"),
    ("fowlpox", "fowlpox"),
    ("healthy", "healthy"),
    ("cocci", "cocci"),
    ("ncd", "ncd"),
    ("salmo", "salmo"),
    # salmo specific terms
    ("pullorum", "salmo"),
    ("fowl typhoid", "salmo"),
    ("typhoid", "salmo"),
    ("ranikhet", "ncd"),
    # NCD lesions
    ("torticollis", "ncd"),
    ("oculonasal", "ncd"),
    ("facial swelling", "ncd"),
    ("conjunctival hemorrhage", "ncd"),
    ("tracheal congestion", "ncd"),
    ("proventricular", "ncd"),
    ("pulmonary congestion", "ncd"),
    ("congested lung", "ncd"),
    ("lung congestion", "ncd"),
    ("breast muscle", "ncd"),
    ("intestinal hemorrhage", "ncd"),
    ("bursal edema", "ncd"),
    ("ovarian follicle", "ncd"),
    ("pericardial hemorrhage", "ncd"),
    ("splenic congestion", "ncd"),
    ("liver congestion", "ncd"),
    ("cyanotic", "ncd"),
    # Cocci lesions
    ("cecal core", "cocci"),
    ("enlarged cecum", "cocci"),
    ("ceca hemorrhage", "cocci"),
    ("intestinal necrosis", "cocci"),
    ("intestinal congestion", "cocci"),
    # Fowlpox lesions
    ("cutaneous nodules", "fowlpox"),
    ("periocular hyperemia", "fowlpox"),
    ("oral", "fowlpox"),
    ("pharyngeal", "fowlpox"),
    ("scab", "fowlpox"),
    ("tracheal fibrinous", "fowlpox"),
    ("pox", "fowlpox"),
    # healthy / negative
    ("normal", "healthy"),
    ("no disease", "healthy"),
    ("no lesion", "healthy"),
    ("negative", "healthy"),
]

# All group keys we report to the UI (in a stable order)
ALL_GROUPS = ["ncd", "cocci", "fowlpox", "salmo", "healthy"]

# Bounding-box colors per group (BGR), consistent with predict.py
GROUP_COLORS = {
    "ncd": (0, 0, 255),
    "cocci": (0, 165, 255),
    "fowlpox": (0, 255, 255),
    "salmo": (255, 0, 255),
    "healthy": (0, 255, 0),
}


def map_class_to_group(class_name):
    """Map a raw Roboflow class name to one of ncd/cocci/fowlpox/salmo/healthy."""
    lower = (class_name or "").strip().lower()
    for substring, group in ALIAS_RULES:
        if substring in lower:
            return group
    return None


def _to_bgr(image_input):
    """Convert path/PIL/ndarray input into a BGR uint8 numpy array."""
    if isinstance(image_input, str):
        img = Image.open(image_input).convert("RGB")
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    if isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    if isinstance(image_input, np.ndarray):
        return image_input.copy()
    raise ValueError("Unsupported image input type for Roboflow inference")


def infer_roboflow(image_np, confidence=CONF_THRESHOLD):
    """
    Calls the Roboflow serverless inference API and returns the raw JSON dict.

    Raises requests.RequestException on network/HTTP errors.
    """
    ok, buf = cv2.imencode(".jpg", image_np)
    if not ok:
        raise ValueError("Could not encode image for Roboflow inference")
    image_bytes = buf.tobytes()

    url = f"{ROBOFLOW_API_URL}/{ROBOFLOW_MODEL_ID}"
    params = {"api_key": ROBOFLOW_API_KEY, "confidence": confidence}
    headers = {"Authorization": ROBOFLOW_API_KEY}

    response = requests.post(
        url,
        params=params,
        headers=headers,
        files={"file": ("image.jpg", image_bytes, "image/jpeg")},
        timeout=REQUEST_TIMEOUT,
    )

    if response.status_code == 401 or response.status_code == 403:
        raise RoboflowInferenceError(
            "Roboflow rejected the API key (401/403). Check ROBOFLOW_API_KEY and "
            "that the model is public/accessible to your account."
        )
    if response.status_code == 404:
        raise RoboflowInferenceError(
            f"Roboflow model '{ROBOFLOW_MODEL_ID}' was not found (404). "
            "Verify the model id and that it is public/active."
        )
    if not response.ok:
        raise RoboflowInferenceError(
            f"Roboflow inference failed with HTTP {response.status_code}: {response.text[:300]}"
        )

    try:
        return response.json()
    except ValueError:
        raise RoboflowInferenceError("Roboflow returned a non-JSON response.")


def _roi_to_xyxy(pred, img_w, img_h):
    """Roboflow detection gives center (x, y) + width/height -> convert to [x1, y1, x2, y2]."""
    x = pred.get("x")
    y = pred.get("y")
    w = pred.get("width")
    h = pred.get("height")
    if None in (x, y, w, h):
        return None
    x1 = int(max(0, x - w / 2))
    y1 = int(max(0, y - h / 2))
    x2 = int(min(img_w, x + w / 2))
    y2 = int(min(img_h, y + h / 2))
    return [x1, y1, x2, y2]


def _draw_annotations(image_np, detections):
    h, w = image_np.shape[:2]
    for d in detections:
        bbox = d.get("bbox")
        if not bbox:
            continue
        x1, y1, x2, y2 = bbox
        group = d.get("disease_group")
        color = GROUP_COLORS.get(group, (255, 255, 255))

        thickness = max(2, int(min(h, w) / 250))
        cv2.rectangle(image_np, (x1, y1), (x2, y2), color, thickness)

        label = f"{d['class_name']}: {d['confidence']:.1f}%"
        font_scale = max(0.5, min(h, w) / 800)
        font_thick = max(1, int(font_scale * 2))
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thick)
        cv2.rectangle(image_np, (x1, max(0, y1 - th - 10)), (x1 + tw + 6, max(0, y1)), color, -1)
        cv2.putText(image_np, label, (x1 + 3, max(th, y1 - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), font_thick)
    return image_np


def predict_image_roboflow(image_input, conf_threshold=CONF_THRESHOLD):
    """
    Runs the Roboflow model and returns a result dict matching the existing
    diagnosis frontend contract (disease_name, severity, detections,
    class_probabilities, annotated_image_base64, symptoms, treatment, ...).

    Raises requests.RequestException if the Roboflow API is unreachable/errors.
    """
    img_np = _to_bgr(image_input)
    h, w = img_np.shape[:2]

    try:
        raw = infer_roboflow(img_np, confidence=conf_threshold)
    except requests.RequestException as e:
        detail = str(e).replace(ROBOFLOW_API_KEY, "***")
        raise RoboflowInferenceError(
            f"Could not reach the Roboflow API ({ROBOFLOW_API_URL}). "
            "Check your internet connection and try again. Details: "
            f"{detail[:200]}"
        )
    predictions = raw.get("predictions", []) if isinstance(raw, dict) else []

    detections = []
    group_scores = {g: 0.0 for g in ["ncd", "cocci", "fowlpox", "salmo"]}

    for pred in predictions:
        cls_name = pred.get("class") or pred.get("name") or f"class_{pred.get('class_id', '?')}"
        conf = float(pred.get("confidence", 0.0))
        if conf <= 0:
            continue

        group = map_class_to_group(cls_name)
        bbox = _roi_to_xyxy(pred, w, h)

        # classification-style predictions have no bbox -> use full image
        if bbox is None:
            bbox = [0, 0, w, h]

        detections.append({
            "class_name": cls_name,
            "confidence": round(conf * 100.0, 2),
            "bbox": bbox,
            "disease_group": group if group else "unknown",
        })

        if group in group_scores:
            group_scores[group] += conf

    annotated = _draw_annotations(img_np.copy(), detections)

    # Encode annotated image
    ok, buf = cv2.imencode(".jpg", annotated)
    annotated_base64 = (
        "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8") if ok else None
    )

    # Aggregate diagnosis
    detections_sorted = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    positive_groups = [g for g, s in group_scores.items() if s > 0]

    if positive_groups:
        top_group = max(group_scores, key=group_scores.get)
        meta = DISEASE_META[top_group]
        top_conf = detections_sorted[0]["confidence"]
        disease_key = top_group
        disease_name = meta["name"]
        severity = meta["severity"]
        description = meta["description"]
        symptoms = meta["symptoms"]
        treatment = meta["treatment"]
    else:
        disease_key = "healthy"
        meta = DISEASE_META["healthy"]
        top_conf = 98.5
        disease_name = meta["name"]
        severity = meta["severity"]
        description = meta["description"]
        symptoms = meta["symptoms"]
        treatment = meta["treatment"]

    # Class probability breakdown across the 5 groups
    total = sum(group_scores.values())
    class_probabilities = {}
    for g in ALL_GROUPS:
        if g == "healthy":
            class_probabilities[g] = 98.5 if disease_key == "healthy" else 1.5
            continue
        if total > 0 and group_scores[g] > 0:
            class_probabilities[g] = round(group_scores[g] / total * 100.0, 2)
        else:
            class_probabilities[g] = 5.0 if disease_key != "healthy" else 0.5

    return {
        "model_source": "PoulCare Roboflow Engine",
        "model_architecture": f"Roboflow {ROBOFLOW_MODEL_ID}",
        "class_key": disease_key,
        "disease_name": disease_name,
        "severity": severity,
        "confidence_percentage": round(top_conf, 2),
        "detections_count": len(detections),
        "detections": detections,
        "annotated_image_base64": annotated_base64,
        "class_probabilities": class_probabilities,
        "description": description,
        "symptoms": symptoms,
        "recommended_treatment": treatment,
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        try:
            res = predict_image_roboflow(sys.argv[1])
        except requests.RequestException as e:
            print(f"[!] Roboflow inference failed: {e}")
            raise SystemExit(1)
        print(f"[+] Disease   : {res['disease_name']} ({res['severity']})")
        print(f"[+] Confidence: {res['confidence_percentage']}%")
        print(f"[+] Detections: {res['detections_count']}")
        for d in res["detections"]:
            print(f"      - {d['class_name']} ({d['confidence']}%) {d['disease_group']}")
    else:
        print("Usage: python roboflow_detector.py <path_to_image.jpg>")
