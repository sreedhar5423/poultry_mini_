# PoulCare — Model Training Guide

This guide explains how to download the dataset and (re)train both models that
power the **Diagnosis** page:

| Model | File | Purpose | Dataset |
|---|---|---|---|
| Lesion / video detector | `weights/hf_poultry_yolo11n.pt` | Detects 26 clinical lesions on bird photos/video (YOLO11n) | Lesion detection dataset (bounding-box annotations) |
| **Fecal classifier** | `poultry_disease_model.pth` | Classifies poultry **droppings** into 4 primary diseases | [Poultry Diseases Detection](https://www.kaggle.com/datasets/kausthubkannan/poultry-diseases-detection) (fecal images) |

> The Kaggle dataset you shared is the **fecal** image dataset (4 classes:
> Coccidiosis, Newcastle Disease, Salmonella, Healthy). It trains the
> **Fecal Detection AI** tab — not the lesion/video detector (that one needs
> bounding-box annotations of lesions).

---

## 1. Download the fecal dataset (Kaggle)

Run this in a terminal with your Kaggle account configured:

```bash
#!/bin/bash
curl -L -o ~/Downloads/poultry-diseases-detection.zip \
  https://www.kaggle.com/api/v1/datasets/download/kausthubkannan/poultry-diseases-detection
```

Then extract it:

```bash
cd ~/Downloads
unzip poultry-diseases-detection.zip -d poultry-diseases-detection
```

The archive contains a `poultry_diseases/` folder with 4 sub-folders:

```
poultry_diseases/
├── cocci/     2103 fecal images  (Coccidiosis)
├── healthy/   2057 fecal images  (Healthy)
├── ncd/        376 fecal images  (Newcastle Disease)
└── salmo/     2276 fecal images  (Salmonella)
```

**Note:** if you use the Kaggle "Download" button (browser) or
`kaggle datasets download -d kausthubkannan/poultry-diseases-detection`
(requires the Kaggle CLI + API token), the result is the same zip.

Move/copy the extracted `poultry_diseases/` folder into this project root, so
that `train.py` finds it:

```
poultry_mini_/
├── poultry_diseases/   <-- put it here
├── train.py
├── evaluate.py
└── ...
```

---

## 2. Retrain the fecal classifier (better accuracy)

```bash
# Install dependencies (Python 3.10/3.11 recommended)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install scikit-learn matplotlib pillow numpy

# Train (defaults are tuned for this dataset)
python train.py --data-dir poultry_diseases --epochs 30 --oversample
```

What the improved training script does differently:

* **Strong augmentation** — random resized crop, flips, ±15° rotation, color
  jitter, random erasing (reduces overfitting, improves generalization).
* **Class-imbalance handling** — inverse-frequency class weights **plus**
  optional `--oversample` (WeightedRandomSampler) because `ncd` has only ~376
  images vs ~2,100 for the other classes.
* **Label smoothing** (0.1) — better-calibrated confidence scores.
* **AdamW + cosine schedule with warmup** — stable convergence.
* **Early stopping** on validation accuracy (`--patience`, default 5).

Useful flags:

```bash
python train.py --data-dir poultry_diseases \
  --epochs 40 --batch-size 64 --lr 1e-3 --oversample \
  --output poultry_disease_model.pth

# If ImageNet weights can't be downloaded (offline), train from scratch:
python train.py --data-dir poultry_diseases --no-pretrained
```

Outputs:

| File | Description |
|---|---|
| `poultry_disease_model.pth` | Best checkpoint (auto-loaded by the app) |
| `test_dataset.json` | Held-out test split (10%) |
| `training_history.json` | Per-epoch loss/accuracy/LR |
| `training_curves.png` | Metric plots |

---

## 3. Evaluate the retrained fecal model

```bash
python evaluate.py
```

Produces a classification report (precision / recall / F1 per class),
`confusion_matrix.png`, `evaluation_report.json`, and exports
`poultry_disease_model.onnx`.

> The bundled `poultry_disease_model.pth` was trained to **99.1% validation
> accuracy**. After retraining with your own copy of the dataset, run
> `evaluate.py` and compare against that baseline.

---

## 4. (Optional) Retrain the lesion / video detector

The video detector is a YOLO11n object detector (`weights/hf_poultry_yolo11n.pt`,
26 lesion classes). Retraining it requires a **detection** dataset with bounding
box annotations (e.g. the `Evet-Africa/poultry-disease-detector` dataset used to
build the bundled weights), **not** the fecal classification dataset.

If you have such a dataset in YOLO format:

```bash
pip install ultralytics

yolo detect train \
  model=yolo11n.pt \
  data=path/to/your/dataset.yaml \
  epochs=100 imgsz=640 batch=16
```

then copy the resulting `runs/detect/train/weights/best.pt` to
`weights/hf_poultry_yolo11n.pt`.

The video pipeline was also upgraded **without retraining** (see
`video_detector.py`) with confidence-weighted majority voting, flicker
suppression, adaptive frame sampling and keyframe de-duplication — so accuracy
on video improves even with the current weights.

---

## 5. Run the full app

```bash
# Backend
pip install flask ultralytics opencv-python-headless torch torchvision scikit-learn matplotlib pillow
python app.py          # http://localhost:5000

# Frontend (in another terminal)
cd frontend
npm install
npm run build          # serve via Flask at http://localhost:5000
# or
npm run dev            # dev server at http://localhost:8080 (proxies /predict*, /predict_fecal)
```

The Diagnosis page now has four tabs: **Image AI**, **Video Detection AI**,
**Fecal Detection AI**, and **Symptom Checker**.
