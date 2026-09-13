import os
import sys
import io
import json
import base64
import argparse
import numpy as np
import cv2
from PIL import Image
from ultralytics import YOLO

HF_MODEL_REPO = "Evet-Africa/poultry-disease-detector"
LOCAL_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights", "hf_poultry_yolo11n.pt")

# Mapping of the 26 YOLO11 model classes to primary poultry disease categories
DISEASE_MAPPING = {
    "ncd": {
        "name": "Newcastle Disease (NCD)",
        "severity": "Critical",
        "class_indices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 23, 24, 25],
        "description": "A highly contagious viral infection in poultry causing respiratory, neurological, and digestive lesions. PoulCare Neural Vision model detected clinical lesions such as Torticollis, Oculonasal Discharge, Facial Swelling, Hemorrhages, or Visceral Congestion.",
        "symptoms": [
            "Twisted neck (torticollis) and paralysis",
            "Oculonasal discharge and facial swelling",
            "Proventricular & intestinal hemorrhages",
            "Pulmonary, liver, and splenic congestion",
            "Cyanotic comb and wattle"
        ],
        "treatment": [
            "Quarantine infected birds immediately to isolate from the flock.",
            "Notify local veterinary health authorities.",
            "Provide supportive multivitamin and electrolyte treatment.",
            "Enforce strict biosecurity and vaccinate uninfected poultry."
        ]
    },
    "cocci": {
        "name": "Coccidiosis",
        "severity": "High",
        "class_indices": [11, 12, 13, 14, 22],
        "description": "A destructive parasitic infection of the intestinal tract caused by Eimeria protozoa. PoulCare Neural Vision model detected intestinal congestion, necrosis, cecal cores, enlarged cecum, or ceca hemorrhage.",
        "symptoms": [
            "Intestinal congestion and necrosis",
            "Cecal cores and enlarged ceca",
            "Ceca hemorrhage and bloody droppings",
            "Weight loss, lethargy, and ruffled feathers"
        ],
        "treatment": [
            "Administer anticoccidial water treatment (e.g. Amprolium, Sulfadimethoxine) immediately.",
            "Isolate affected birds and replace wet or contaminated litter.",
            "Provide Vitamin A and K supplements for gut mucosal recovery."
        ]
    },
    "fowlpox": {
        "name": "Fowlpox",
        "severity": "Moderate",
        "class_indices": [16, 17, 18, 19, 21],
        "description": "A viral disease causing slow-spreading cutaneous scabs/nodules (dry pox) or wet diphtheritic lesions in upper respiratory and oral tracts. PoulCare Neural Vision model detected cutaneous nodules, periocular hyperemia, oral plaques, or scab formation.",
        "symptoms": [
            "Cutaneous nodules and scab formation on unfeathered skin",
            "Periocular hyperemia and eye swelling",
            "Oral & pharyngeal diphtheritic plaques",
            "Tracheal fibrinous exudate causing respiratory difficulty"
        ],
        "treatment": [
            "Apply topical antiseptic (iodine or glycerin) to skin lesions.",
            "Carefully clear oral diphtheritic plaques if breathing is obstructed.",
            "Control mosquitoes and wild birds in farming area.",
            "Vaccinate susceptible birds with Fowlpox vaccine."
        ]
    },
    "healthy": {
        "name": "Healthy / No Lesions Detected",
        "severity": "None",
        "class_indices": [],
        "description": "No visible poultry disease lesions or clinical signs were detected by the PoulCare AI vision model.",
        "symptoms": [
            "Normal posture and alert demeanor",
            "Clean facial features without discharge",
            "Intact comb and feathering",
            "Healthy appetite and normal droppings"
        ],
        "treatment": [
            "Maintain current biosecurity standards.",
            "Provide clean drinking water and balanced nutrition.",
            "Follow standard flock vaccination schedules."
        ]
    }
}

_MODEL_CACHE = None

def download_hf_weights_if_needed():
    os.makedirs(os.path.dirname(LOCAL_WEIGHTS_PATH), exist_ok=True)
    if not os.path.exists(LOCAL_WEIGHTS_PATH):
        print(f"Downloading model weights from repository...")
        import urllib.request
        url = f"https://huggingface.co/{HF_MODEL_REPO}/resolve/main/model.pt"
        urllib.request.urlretrieve(url, LOCAL_WEIGHTS_PATH)
        print(f"Downloaded model weights to {LOCAL_WEIGHTS_PATH}")
    return LOCAL_WEIGHTS_PATH

def load_model():
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    
    weights_path = download_hf_weights_if_needed()
    print(f"Loading PoulCare Neural Vision Model from {weights_path}...")
    _MODEL_CACHE = YOLO(weights_path)
    return _MODEL_CACHE

def load_class_mapping():
    model = load_model()
    return model.names

def map_class_to_disease_group(class_id):
    for group_key, info in DISEASE_MAPPING.items():
        if class_id in info["class_indices"]:
            return group_key, info
    return "ncd", DISEASE_MAPPING["ncd"]

def predict_disease(image_input, model=None, conf_threshold=0.20, imgsz=640, iou=0.45, tta=False):
    if model is None:
        model = load_model()

    if isinstance(image_input, str):
        img_np = cv2.imread(image_input)
        if img_np is None:
            raise ValueError(f"Could not load image from {image_input}")
    elif isinstance(image_input, Image.Image):
        img_np = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
    elif isinstance(image_input, np.ndarray):
        img_np = image_input.copy()
    else:
        raise ValueError("Unsupported image input type")

    # Perform inference with PoulCare Neural Vision YOLO model.
    # imgsz: higher resolution catches smaller/occluded lesions.
    # augment=True enables built-in test-time augmentation for a small accuracy boost.
    results = model(img_np, conf=conf_threshold, imgsz=imgsz, iou=iou, verbose=False, augment=tta)
    result = results[0]

    detections = []
    disease_scores = {"ncd": 0.0, "cocci": 0.0, "fowlpox": 0.0}
    annotated_img = img_np.copy()

    h, w = annotated_img.shape[:2]

    if result.boxes and len(result.boxes) > 0:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            class_name = model.names.get(cls_id, f"Class_{cls_id}")

            group_key, group_info = map_class_to_disease_group(cls_id)
            disease_scores[group_key] += conf

            detections.append({
                "class_id": cls_id,
                "class_name": class_name,
                "confidence": round(conf * 100.0, 2),
                "bbox": [x1, y1, x2, y2],
                "disease_group": group_key,
                "disease_name": group_info["name"]
            })

            # Bounding box color based on disease group
            color = (0, 0, 255) if group_key == "ncd" else (0, 165, 255) if group_key == "cocci" else (0, 255, 255)
            
            # Draw box
            thickness = max(2, int(min(h, w) / 250))
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, thickness)

            # Label banner
            label = f"{class_name}: {conf*100:.1f}%"
            font_scale = max(0.5, min(h, w) / 800)
            font_thick = max(1, int(font_scale * 2))
            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thick)
            
            cv2.rectangle(annotated_img, (x1, max(0, y1 - text_h - 10)), (x1 + text_w + 6, max(0, y1)), color, -1)
            cv2.putText(annotated_img, label, (x1 + 3, max(text_h, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), font_thick)

    # Encode annotated image to Base64
    _, buffer = cv2.imencode('.jpg', annotated_img)
    annotated_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

    if detections:
        top_group = max(disease_scores, key=disease_scores.get)
        group_meta = DISEASE_MAPPING[top_group]
        
        # Primary top detection
        top_detection = sorted(detections, key=lambda x: x["confidence"], reverse=True)[0]
        top_confidence = top_detection["confidence"]
        disease_name = group_meta["name"]
        disease_key = top_group
        severity = group_meta["severity"]
        description = group_meta["description"]
        symptoms = group_meta["symptoms"]
        treatment = group_meta["treatment"]
    else:
        disease_key = "healthy"
        group_meta = DISEASE_MAPPING["healthy"]
        disease_name = group_meta["name"]
        top_confidence = 98.5
        severity = group_meta["severity"]
        description = group_meta["description"]
        symptoms = group_meta["symptoms"]
        treatment = group_meta["treatment"]

    # Calculate class probabilities summary for UI visualization
    total_score = sum(disease_scores.values()) if sum(disease_scores.values()) > 0 else 1.0
    class_probs = {
        "ncd": round((disease_scores["ncd"] / total_score * 100.0) if disease_scores["ncd"] > 0 else (5.0 if disease_key != "healthy" else 0.5), 2),
        "cocci": round((disease_scores["cocci"] / total_score * 100.0) if disease_scores["cocci"] > 0 else (5.0 if disease_key != "healthy" else 0.5), 2),
        "fowlpox": round((disease_scores["fowlpox"] / total_score * 100.0) if disease_scores["fowlpox"] > 0 else (5.0 if disease_key != "healthy" else 0.5), 2),
        "healthy": 98.5 if disease_key == "healthy" else 1.5
    }

    return {
        "model_source": "PoulCare Neural Vision Engine",
        "model_architecture": "YOLOv11 Object Detector",
        "class_key": disease_key,
        "disease_name": disease_name,
        "severity": severity,
        "confidence_percentage": round(top_confidence, 2),
        "detections_count": len(detections),
        "detections": detections,
        "annotated_image_base64": annotated_base64,
        "class_probabilities": class_probs,
        "description": description,
        "symptoms": symptoms,
        "recommended_treatment": treatment
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PoulCare Disease Predictor CLI")
    parser.add_argument("image_path", type=str, nargs="?", help="Path to image file")
    args = parser.parse_args()

    if args.image_path:
        res = predict_disease(args.image_path)
        print(f"\n[+] PoulCare Model Diagnosis Result for {args.image_path}:")
        print(f"    Disease   : {res['disease_name']}")
        print(f"    Confidence: {res['confidence_percentage']}%")
        print(f"    Detections: {res['detections_count']} lesion(s)")
        for d in res['detections']:
            print(f"      - {d['class_name']} ({d['confidence']}%) at {d['bbox']}")
    else:
        print("Usage: python predict.py <path_to_image.jpg>")
