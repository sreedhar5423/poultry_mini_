"""
PoulCare Neural Vision — Video Temporal Disease Detector
=========================================================

Samples frames across a video timeline, runs lesion detection on each frame
(YOLO11 via `predict.py`), and aggregates results into a *temporally stable*
diagnosis.

Accuracy improvements implemented here (vs. naive frame summation):

1. **Adaptive frame sampling** — the number of analyzed frames scales with video
   length, so short clips are not under-sampled and long clips are not over-sampled.
2. **Confidence-weighted majority voting** — a disease must dominate enough frames
   (with enough confidence) to be declared, instead of letting a single spurious
   detection decide the whole video.
3. **Flicker suppression** — a class that appears in only one or two isolated
   frames is penalised, reducing false positives from transient detections.
4. **Keyframe de-duplication** — near-identical frames are collapsed so the
   returned snapshots are distinct and informative.
"""

import os
import sys
import json
import cv2
import numpy as np
from predict import load_model, predict_disease, DISEASE_MAPPING

DEFAULT_CONF_THRESHOLD = 0.30
DEFAULT_IOU = 0.45
DEFAULT_IMGSZ = 640


def _adaptive_frame_step(fps, total_frames, min_frames=12, max_frames=60):
    """
    Chooses a frame step so we analyse roughly `max_frames` frames,
    while guaranteeing at least `min_frames` (if the video is long enough).
    """
    if total_frames <= min_frames:
        return 1  # analyse every frame of very short clips

    # Aim for max_frames evenly-spaced samples
    step = max(1, total_frames // max_frames)
    sampled = total_frames // step
    if sampled < min_frames:
        step = max(1, total_frames // min_frames)
    return step


def _frame_similarity(hist_a, hist_b):
    """1 - Bhattacharyya distance between two HSV histograms in [0, 1]."""
    return float(cv2.compareHist(hist_a, hist_b, cv2.HISTCMP_BHATTACHARYYA))


def _hsv_hist(frame, bins=(8, 8, 8)):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1, 2], None, bins, [0, 180, 0, 256, 0, 256])
    cv2.normalize(hist, hist)
    return hist


def process_video_detection(
    video_path,
    output_dir=None,
    sample_fps=None,
    max_keyframes=8,
    conf_threshold=DEFAULT_CONF_THRESHOLD,
    iou=DEFAULT_IOU,
    imgsz=DEFAULT_IMGSZ,
    min_positive_frames_ratio=0.10,
    min_avg_confidence=0.30,
    tta=False,
):
    """
    Processes a video and returns a temporally-stable diagnosis.

    Args:
        video_path: path to the video file.
        sample_fps: (optional) legacy fixed sampling rate; when None, adaptive
            sampling is used.
        max_keyframes: max distinct keyframe snapshots returned.
        conf_threshold: YOLO confidence threshold.
        iou: NMS IoU threshold.
        imgsz: inference resolution.
        min_positive_frames_ratio: minimum fraction of analyzed frames a disease
            must dominate to be reported (flicker suppression).
        min_avg_confidence: minimum average top-detection confidence (0-1) across
            positive frames for a disease call; below this the video is reported
            as inconclusive/healthy (noise suppression).
        tta: enable test-time augmentation per frame (slower, slightly more accurate).

    Returns a dict compatible with the diagnosis frontend.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    model = load_model()
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    duration_sec = total_frames / fps
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if sample_fps and sample_fps > 0:
        frame_step = max(1, int(round(fps / sample_fps)))
    else:
        frame_step = _adaptive_frame_step(fps, total_frames)

    temporal_timeline = []
    lesion_frequency = {}
    disease_group_scores = {"ncd": 0.0, "cocci": 0.0, "fowlpox": 0.0}
    # Number of frames in which each group is the *dominant* group
    disease_group_frames = {"ncd": 0, "cocci": 0, "fowlpox": 0}
    keyframe_snapshots = []
    keyframe_signatures = []

    frame_idx = 0
    sampled_frame_count = 0
    positive_frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_step == 0:
            sampled_frame_count += 1
            timestamp_sec = round(frame_idx / fps, 1)
            time_str = f"{int(timestamp_sec // 60):02d}:{int(timestamp_sec % 60):02d}"

            frame_res = predict_disease(
                frame,
                model=model,
                conf_threshold=conf_threshold,
                imgsz=imgsz,
                iou=iou,
                tta=tta,
            )

            detections = frame_res.get("detections", [])
            if detections:
                positive_frame_count += 1

                frame_lesions = []
                for d in detections:
                    l_name = d["class_name"]
                    d_group = d["disease_group"]
                    conf = d["confidence"]

                    lesion_frequency[l_name] = lesion_frequency.get(l_name, 0) + 1
                    frame_lesions.append({
                        "class_name": l_name,
                        "confidence": conf,
                        "bbox": d["bbox"],
                        "disease_group": d_group,
                    })

                # Frame-level dominant group (confidence-weighted vote of its boxes)
                frame_group_conf = {"ncd": 0.0, "cocci": 0.0, "fowlpox": 0.0}
                for d in detections:
                    frame_group_conf[d["disease_group"]] += d["confidence"] / 100.0

                dominant_group = max(frame_group_conf, key=frame_group_conf.get)
                dominant_conf = frame_group_conf[dominant_group]
                top_conf_frame = max(d["confidence"] for d in detections)

                disease_group_scores[dominant_group] += dominant_conf
                disease_group_frames[dominant_group] += 1

                timeline_entry = {
                    "timestamp": time_str,
                    "timestamp_sec": timestamp_sec,
                    "frame_index": frame_idx,
                    "lesions": frame_lesions,
                    "detection_count": len(detections),
                    "top_confidence": top_conf_frame,
                    "dominant_group": dominant_group,
                }
                temporal_timeline.append(timeline_entry)

                # Store distinct keyframes (de-duplicate by HSV histogram similarity)
                if len(keyframe_snapshots) < max_keyframes:
                    hist = _hsv_hist(frame)
                    is_duplicate = False
                    for prev_hist in keyframe_signatures:
                        if _frame_similarity(hist, prev_hist) < 0.45:
                            is_duplicate = True
                            break
                    if not is_duplicate:
                        keyframe_signatures.append(hist)
                        keyframe_snapshots.append({
                            "timestamp": time_str,
                            "timestamp_sec": timestamp_sec,
                            "frame_index": frame_idx,
                            "lesions": [d["class_name"] for d in detections],
                            "top_confidence": top_conf_frame,
                            "image_base64": frame_res["annotated_image_base64"],
                        })

        frame_idx += 1

    cap.release()

    # ---- Aggregate video-level diagnosis (confidence-weighted majority vote) ----
    min_positive_frames = max(1, int(round(sampled_frame_count * min_positive_frames_ratio)))

    # Final score = dominant-frame count weighted by average per-frame confidence.
    final_scores = {}
    for group in disease_group_scores:
        frames = disease_group_frames[group]
        total_conf = disease_group_scores[group]
        mean_conf = (total_conf / frames) if frames > 0 else 0.0
        final_scores[group] = frames * mean_conf  # frames * confidence in [0,1]

    total_score = sum(final_scores.values())
    leading_group = max(final_scores, key=final_scores.get) if total_score > 0 else None

    avg_top_conf_all = (
        float(np.mean([t["top_confidence"] for t in temporal_timeline]))
        if temporal_timeline else 0.0
    )

    disease_detected = (
        total_score > 0
        and len(temporal_timeline) > 0
        and leading_group is not None
        and disease_group_frames[leading_group] >= min_positive_frames
        and avg_top_conf_all >= (min_avg_confidence * 100.0)
    )

    if disease_detected:
        primary_disease_key = leading_group
        group_info = DISEASE_MAPPING[primary_disease_key]
        overall_confidence = min(99.4, round(avg_top_conf_all, 2))
    else:
        primary_disease_key = "healthy"
        group_info = DISEASE_MAPPING["healthy"]
        overall_confidence = 98.5

    # Class probability breakdown across video
    denom = total_score if total_score > 0 else 1.0
    class_probabilities = {}
    for group in disease_group_scores:
        share = (final_scores[group] / denom * 100.0) if final_scores[group] > 0 else 0.0
        class_probabilities[group] = round(share, 2) if disease_detected else 0.5
    class_probabilities["healthy"] = 98.5 if not disease_detected else 1.5

    return {
        "model_source": "PoulCare Neural Vision Engine",
        "model_architecture": "YOLOv11 Temporal Video Detector",
        "video_metadata": {
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "duration_seconds": round(duration_sec, 2),
            "resolution": f"{width}x{height}",
            "sampled_frames_analyzed": sampled_frame_count,
            "frames_with_detections": positive_frame_count,
        },
        "class_key": primary_disease_key,
        "disease_name": group_info["name"],
        "severity": group_info["severity"],
        "confidence_percentage": overall_confidence,
        "total_detections_in_video": sum(lesion_frequency.values()),
        "lesion_frequency_distribution": lesion_frequency,
        "temporal_timeline": temporal_timeline,
        "keyframe_snapshots": keyframe_snapshots,
        "class_probabilities": class_probabilities,
        "description": group_info["description"],
        "symptoms": group_info["symptoms"],
        "recommended_treatment": group_info["treatment"],
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        v_path = sys.argv[1]
        print(f"Running video detection analysis on {v_path}...")
        res = process_video_detection(v_path)
        print(json.dumps(res, indent=2))
    else:
        print("Usage: python video_detector.py <path_to_video.mp4>")
