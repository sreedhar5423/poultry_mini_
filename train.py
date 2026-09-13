"""
PoulCare Fecal Disease Model — Training Pipeline
================================================

Trains a MobileNetV3-Large classifier on the "Poultry Diseases Detection" fecal
dataset (4 classes: cocci / healthy / ncd / salmo).

Dataset layout expected (matches the Kaggle download after extraction):

    poultry_diseases/
      ├── cocci/     (2103 images)
      ├── healthy/   (2057 images)
      ├── ncd/       ( 376 images)
      └── salmo/     (2276 images)

Accuracy improvements over the original script:
  * Strong data augmentation (random resized crop, flips, rotation, color
    jitter, random erasing) -> better generalization.
  * Label smoothing -> less overconfident predictions, better calibration.
  * Class-imbalance handling via inverse-frequency class weights *and*
    optional oversampling (WeightedRandomSampler) for the under-represented
    "ncd" class.
  * AdamW + cosine schedule with linear warmup.
  * Early stopping on validation accuracy (no more fixed 10 epochs).
  * Saves best checkpoint + training history JSON + metric curves.

Usage:
    python train.py --data-dir poultry_diseases --epochs 30
"""

import os
import sys
import json
import random
import argparse

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
from sklearn.model_selection import train_test_split
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Determinism
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

CLASSES = ["cocci", "healthy", "ncd", "salmo"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}
DISPLAY_NAMES = ["Coccidiosis", "Healthy", "Newcastle Disease", "Salmonella"]

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class FecalDataset(Dataset):
    """On-the-fly loading dataset with strong training augmentation."""

    def __init__(self, image_paths, labels, is_train=True, in_memory=False):
        self.image_paths = image_paths
        self.labels = torch.tensor(labels, dtype=torch.long)
        self.is_train = is_train
        self.in_memory = in_memory

        base = [
            transforms.Resize((224, 224), interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
        train_aug = [
            transforms.RandomResizedCrop(224, scale=(0.7, 1.0), interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            transforms.RandomErasing(p=0.25, scale=(0.02, 0.15), value="random"),
        ]
        if is_train:
            self.transform = transforms.Compose(train_aug)
        else:
            self.transform = transforms.Compose(base)

        if self.in_memory:
            print(f"Pre-loading {len(image_paths)} images into memory (uint8)...", flush=True)
            cache = []
            for i, p in enumerate(image_paths):
                try:
                    img = Image.open(p).convert("RGB")
                except Exception:
                    img = Image.new("RGB", (224, 224), (0, 0, 0))
                cache.append(img)
                if (i + 1) % 2000 == 0 or (i + 1) == len(image_paths):
                    print(f"  Loaded [{i+1}/{len(image_paths)}]", flush=True)
            self.cache = cache

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        if self.in_memory:
            img = self.cache[idx]
        else:
            try:
                img = Image.open(self.image_paths[idx]).convert("RGB")
            except Exception:
                img = Image.new("RGB", (224, 224), (0, 0, 0))
        x = self.transform(img)
        return x, self.labels[idx]


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def build_model(num_classes=4, pretrained=True):
    try:
        weights = models.MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
        model = models.mobilenet_v3_large(weights=weights)
    except Exception:
        model = models.mobilenet_v3_large(pretrained=pretrained)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    return model


def load_dataset(data_dir):
    image_paths, labels = [], []
    for c in CLASSES:
        cat_dir = os.path.join(data_dir, c)
        if not os.path.isdir(cat_dir):
            continue
        for fname in sorted(os.listdir(cat_dir)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp")):
                image_paths.append(os.path.join(cat_dir, fname))
                labels.append(CLASS_TO_IDX[c])
    return image_paths, labels


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train(args):
    torch.set_num_threads(os.cpu_count() or 4)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}", flush=True)

    image_paths, labels = load_dataset(args.data_dir)
    if len(image_paths) == 0:
        print(f"ERROR: no images found under {args.data_dir}. "
              f"Expected subdirectories: {CLASSES}", flush=True)
        sys.exit(1)

    print(f"Total dataset size: {len(image_paths)} images", flush=True)
    dist = {}
    for lbl in labels:
        dist[CLASSES[lbl]] = dist.get(CLASSES[lbl], 0) + 1
    print(f"Class distribution: {dist}", flush=True)

    # Stratified splits: train 80% / val 10% / test 10% (falls back gracefully on tiny sets)
    def safe_split(paths, lbls, test_size):
        try:
            return train_test_split(paths, lbls, test_size=test_size, random_state=SEED, stratify=lbls)
        except ValueError:
            return train_test_split(paths, lbls, test_size=test_size, random_state=SEED)

    train_paths, temp_paths, train_labels, temp_labels = safe_split(image_paths, labels, 0.20)
    val_paths, test_paths, val_labels, test_labels = safe_split(temp_paths, temp_labels, 0.50)
    print(f"Train: {len(train_paths)} | Val: {len(val_paths)} | Test: {len(test_paths)}", flush=True)

    # Persist test split for evaluate.py (uses forward slashes)
    test_json = {"paths": [p.replace("\\", "/") for p in test_paths], "labels": test_labels}
    with open(args.test_split, "w") as f:
        json.dump(test_json, f, indent=2)
    print(f"Saved test split to {args.test_split}", flush=True)

    train_dataset = FecalDataset(train_paths, train_labels, is_train=True, in_memory=args.in_memory)
    val_dataset = FecalDataset(val_paths, val_labels, is_train=False, in_memory=args.in_memory)

    # Class weights (inverse frequency) for the loss
    class_counts = np.bincount(train_labels, minlength=len(CLASSES)).astype(np.float32)
    class_weights = len(train_labels) / (len(CLASSES) * class_counts)
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device)
    print("Loss class weights:", dict(zip(CLASSES, np.round(class_weights, 3))), flush=True)

    # Optional oversampling for the minority class(es)
    sampler = None
    shuffle = True
    if args.oversample:
        sample_weights = torch.tensor([class_weights[l] for l in train_labels], dtype=torch.float64)
        sampler = WeightedRandomSampler(sample_weights, num_samples=len(train_labels), replacement=True)
        shuffle = False
        print("WeightedRandomSampler enabled (minority-class oversampling).", flush=True)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=shuffle, sampler=sampler)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False)

    model = build_model(num_classes=len(CLASSES), pretrained=not args.no_pretrained).to(device)

    criterion = nn.CrossEntropyLoss(
        weight=class_weights_tensor, label_smoothing=args.label_smoothing
    )
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)

    steps_per_epoch = max(1, len(train_loader))
    total_steps = steps_per_epoch * args.epochs
    warmup_steps = max(1, int(steps_per_epoch * args.warmup_epochs))

    def lr_lambda(step):
        if step < warmup_steps:
            return step / warmup_steps
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1 + np.cos(np.pi * progress))

    scheduler = optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": [], "lr": []}
    best_val_acc = 0.0
    patience_counter = 0
    best_state = None

    print(f"\n--- Training ({args.epochs} epochs, early-stop patience {args.patience}) ---", flush=True)
    for epoch in range(1, args.epochs + 1):
        # ---- Train ----
        model.train()
        running_loss, correct, total = 0.0, 0, 0
        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            scheduler.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == targets).sum().item()
            total += targets.size(0)

        train_loss = running_loss / total
        train_acc = correct / total

        # ---- Validate ----
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == targets).sum().item()
                val_total += targets.size(0)

        val_loss /= val_total
        val_acc = val_correct / val_total

        lr_now = optimizer.param_groups[0]["lr"]
        history["train_loss"].append(round(train_loss, 6))
        history["train_acc"].append(round(train_acc, 6))
        history["val_loss"].append(round(val_loss, 6))
        history["val_acc"].append(round(val_acc, 6))
        history["lr"].append(round(lr_now, 8))

        print(f"Epoch [{epoch:02d}/{args.epochs}] | "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}% | lr {lr_now:.2e}", flush=True)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            best_state = {
                "epoch": epoch,
                "model_state_dict": {k: v.cpu().clone() for k, v in model.state_dict().items()},
                "val_acc": best_val_acc,
                "val_loss": val_loss,
                "classes": CLASSES,
                "history": history,
            }
            print(f"  --> New best model (Val Acc {best_val_acc*100:.2f}%)", flush=True)
        else:
            patience_counter += 1
            if patience_counter >= args.patience:
                print(f"Early stopping triggered at epoch {epoch} (no val-acc improvement for "
                      f"{args.patience} epochs).", flush=True)
                break

    # Save the best model + metrics
    torch.save(best_state, args.output)
    print(f"\nSaved best model to {args.output} (Val Acc: {best_val_acc*100:.2f}%)", flush=True)

    with open(args.history_json, "w") as f:
        json.dump(history, f, indent=2)
    print(f"Saved training history to {args.history_json}", flush=True)

    plot_metrics(history, args.plot)


def plot_metrics(history, path):
    epochs = range(1, len(history["train_loss"]) + 1)
    fig, axs = plt.subplots(1, 3, figsize=(16, 5))

    axs[0].plot(epochs, history["train_loss"], label="Train Loss", marker="o")
    axs[0].plot(epochs, history["val_loss"], label="Val Loss", marker="o")
    axs[0].set_title("Loss per Epoch")
    axs[0].set_xlabel("Epoch"); axs[0].set_ylabel("Loss")
    axs[0].grid(True); axs[0].legend()

    axs[1].plot(epochs, [a * 100 for a in history["train_acc"]], label="Train Acc (%)", marker="o")
    axs[1].plot(epochs, [a * 100 for a in history["val_acc"]], label="Val Acc (%)", marker="o")
    axs[1].set_title("Accuracy per Epoch")
    axs[1].set_xlabel("Epoch"); axs[1].set_ylabel("Accuracy (%)")
    axs[1].grid(True); axs[1].legend()

    axs[2].plot(epochs, history["lr"], label="Learning Rate", marker="o", color="green")
    axs[2].set_title("Learning Rate Schedule")
    axs[2].set_xlabel("Epoch"); axs[2].set_ylabel("LR")
    axs[2].set_yscale("log")
    axs[2].grid(True)

    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)
    print(f"Saved training curves to {path}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train PoulCare fecal disease classifier")
    parser.add_argument("--data-dir", type=str, default="poultry_diseases", help="Root dir with cocci/healthy/ncd/salmo subfolders")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--label-smoothing", type=float, default=0.1)
    parser.add_argument("--warmup-epochs", type=float, default=1.0)
    parser.add_argument("--patience", type=int, default=5)
    parser.add_argument("--oversample", action="store_true", help="Enable WeightedRandomSampler for imbalance")
    parser.add_argument("--no-pretrained", action="store_true", help="Train from scratch (no ImageNet weights)")
    parser.add_argument("--in-memory", action="store_true", help="Pre-load all images into memory (faster, more RAM)")
    parser.add_argument("--output", type=str, default="poultry_disease_model.pth")
    parser.add_argument("--test-split", type=str, default="test_dataset.json")
    parser.add_argument("--history-json", type=str, default="training_history.json")
    parser.add_argument("--plot", type=str, default="training_curves.png")
    args = parser.parse_args()
    train(args)
