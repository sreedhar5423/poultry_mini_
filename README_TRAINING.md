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

## 1. Download and retrain the fecal classifier

The fecal tab uses `poultry_disease_model.pth` on Flask startup. A new model is
trained **to a separate candidate file** so an incomplete/poor run cannot
silently replace the deployed checkpoint. Install compatible PyTorch and
TorchVision builds for your machine, then `pip install -r requirements.txt
kagglehub`.

```bash
# Downloads the exact Kaggle dataset requested (configure Kaggle access if required).
python train.py --download --epochs 30 --batch-size 32

# Or download separately, then train from its local path:
python -c 'import kagglehub; print(kagglehub.dataset_download("kausthubkannan/poultry-diseases-detection"))'
python train.py --data-dir /path/printed/above --epochs 30 --batch-size 32
```

The directory may be either `poultry_diseases/` itself or its parent. It must
contain `cocci/`, `healthy/`, `ncd/`, `salmo/`. Inputs are checked for readable
images; no broken image is replaced with a black training sample. Exact and
near-identical images are grouped *before* splitting to avoid train/test
leakage. Conflicting duplicate labels stop training for manual inspection.
This dHash heuristic is not a guarantee against every kind of duplicate;
review acquisition sources and hold out entire farms/sessions if available.

Training uses augmentation, label smoothing, weight decay, inverse-frequency
loss weights (or `--oversample`, **not both**), validation-loss early stopping,
and logs train/validation loss, accuracy and validation macro F1. Validation
selects the epoch; the separate test partition is reserved for one final check.

## 2. Evaluate and connect to the Fecal Detection AI tab

```bash
python evaluate.py --model fecal_candidate.pth --test-split fecal_candidate_test.json
# Only after checking the per-class report, explicitly promote if the gate passes:
python evaluate.py --model fecal_candidate.pth --test-split fecal_candidate_test.json --deploy
# Restart python app.py (the checkpoint is cached in memory on startup).
```

The gate requires validation and test macro F1 >= 0.80, validation accuracy
>= 0.80 and a validation/test macro F1 gap <= 0.10. This is a minimum
screen, **not proof** that the model cannot overfit. Check training curves,
confusion matrix in `fecal_candidate_report.json`, external field photos and
per-class recall before use. If the gate fails, the existing model remains
connected; collect more diverse images instead of lowering thresholds to
force deployment. Candidate data, metrics and checkpoints are local and ignored
by Git. To ship the promoted model, explicitly commit the updated
`poultry_disease_model.pth` after reviewing its report.

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

## 5. Fecal image validation gate

`predict_fecal` (used by the **Fecal Detection AI** tab) first checks that the
uploaded image actually looks like a droppings sample. If it doesn't (bird,
person, landscape, document, flat/solid image, ...), the API returns
`422 {"code": "not_fecal_image", "error": "..."}` and the UI shows a clear
"please upload a fecal image" message.

The gate combines 4 signals, all tunable:

| Signal | Env var | Default | Meaning |
|---|---|---|---|
| Top-class confidence | `FECAL_MIN_CONFIDENCE` | `0.55` | reject if the model is less sure than this |
| Prediction entropy | `FECAL_MAX_ENTROPY` | `0.62` | reject if the 4-class probabilities are too spread out |
| Blue/purple pixel ratio | `FECAL_MAX_NONFECAL_HUE` | `0.30` | reject if >30% pixels are saturated blue/violet (never in droppings) |
| Image texture | `FECAL_MIN_TEXTURE` | `5.0` | reject if the image is too flat/uniform |

Tune by setting the env var before starting the app, e.g.:

```bash
FECAL_MIN_CONFIDENCE=0.50 python app.py
```

or per-call via `predict_fecal(..., thresholds={...})`.

## 6. Image AI Diagnosis (Roboflow)

The **Image AI Diagnosis** tab runs on a Roboflow serverless model instead of
the bundled local YOLO weights:

```
model_id : poultry-disease-detection-quprj/9
api_url  : https://serverless.roboflow.com
api_key  : configured in roboflow_detector.py (env-var overridable)
```

Configuration (set before starting the app if you need to change them):

```bash
export ROBOFLOW_API_KEY="your-key"
export ROBOFLOW_MODEL_ID="your-workspace/your-model/version"
export ROBOFLOW_API_URL="https://serverless.roboflow.com"   # optional
python app.py
```

Notes:

* The app calls the Roboflow REST endpoint directly with `requests`
  (multipart upload + `api_key` query param + `Authorization` header), which is
  equivalent to the `inference_sdk.InferenceHTTPClient` snippet. This avoids the
  `inference-sdk` dependency, which forces `numpy>=2.0` and GUI OpenCV and
  breaks the CPU/headless torch stack used by the rest of the app.
* The model's raw class names are mapped to the 5 disease groups
  (Coccidiosis / Newcastle / Fowlpox / Salmonella / Healthy) via
  `ALIAS_RULES` in `roboflow_detector.py`. If your model uses different class
  names, extend that list.
* **Offline fallback:** the Image AI tab tries Roboflow first; if Roboflow is
  unreachable (no internet / bad key / model not found), it automatically falls
  back to the bundled local YOLO11 model so image diagnosis still works offline.
  The result includes an `engine` field (`roboflow` or `local_offline`) and the
  UI shows an "Offline mode — local model" badge when the fallback was used.
* The **Video Detection AI** tab still uses the local YOLO11 weights
  (`weights/hf_poultry_yolo11n.pt`) and the **Fecal Detection AI** tab still
  uses the local MobileNetV3 classifier (`poultry_disease_model.pth`).

## 7. Run the full app

```bash
# Backend
pip install -r requirements.txt
# (install torch/torchvision first for your platform — see requirements.txt header)
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

## 8. Use the Kaggle notebook model offline (optional, different architecture)

[Kausthub Kannan's Kaggle notebook](https://www.kaggle.com/code/kausthubkannan/poultry-disease-detection/output)
provides a `model.hdf5` output trained with TensorFlow Hub MobileNetV2.
This is **not** the PyTorch MobileNetV3 checkpoint described above. A notebook
URL or `kaggle kernels pull` only provides code, not the model weights. Download
notebook **output** on a machine that has Kaggle access:

```bash
kaggle kernels output kausthubkannan/poultry-disease-detection -p kaggle_output
# Use TensorFlow + tensorflow_hub in a compatible Kaggle notebook environment:
python export_kaggle_fecal.py kaggle_output/model.hdf5 kaggle_fecal.tflite
# After reviewing accuracy on independent labeled images:
cp kaggle_fecal.tflite weights/kaggle_fecal.tflite
```

For local conversion, install TensorFlow and tensorflow-hub separately; those
large dependencies are **not** required to serve the exported model. The
conversion script checks input/output shapes and numerical agreement with the
Keras model. The Kaggle training notebook uses `rescale=1/225.` (not 1/255)
and its four classes are alphabetically ordered: cocci, healthy, ncd, salmo.
The app's offline TFLite adapter reproduces this preprocessing and exposes the
same `/predict_fecal` JSON. It uses `tflite-runtime` on Linux; on Windows,
install TensorFlow for its bundled TFLite interpreter. Inference does not
contact Kaggle or TensorFlow Hub. Restart Flask after installing the artifact; the
`/health` response reports which fecal architecture is active.

**Important:** the model file is not in this repository and Kaggle is not
reachable from this workspace. Until `weights/kaggle_fecal.tflite` exists, the
app keeps its existing PyTorch fecal checkpoint as a compatibility fallback.
Do not claim the Kaggle model is active until `/health` says
`Kaggle MobileNetV2 (offline TFLite)`. The Kaggle notebook's reported
validation score is not an independent held-out field test and does not
establish that this model is less overfitted; evaluate real unseen samples
and per-class Newcastle recall before switching.
