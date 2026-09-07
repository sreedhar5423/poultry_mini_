import os
import sys
import json
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# Set multithreading and random seeds
torch.set_num_threads(os.cpu_count() or 8)
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

DATA_DIR = "poultry_diseases"
MODEL_SAVE_PATH = "poultry_disease_model.pth"
TEST_SPLIT_PATH = "test_dataset.json"
METRICS_PLOT_PATH = "training_curves.png"

CLASSES = ["cocci", "healthy", "ncd", "salmo"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}

# Pre-defined fast tensor transforms
NORMALIZE = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
TO_TENSOR = transforms.ToTensor()

class FastTensorDataset(Dataset):
    """In-memory PyTorch Tensor dataset for instant CPU training (~5-10s per epoch)."""
    def __init__(self, image_paths, labels, is_train=True):
        self.labels = torch.tensor(labels, dtype=torch.long)
        self.is_train = is_train
        
        print(f"Pre-loading & converting {len(image_paths)} images to Tensors...", flush=True)
        tensors = []
        for i, path in enumerate(image_paths):
            try:
                img = Image.open(path).convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
            except Exception:
                img = Image.new("RGB", (224, 224), (0, 0, 0))
            tensors.append(NORMALIZE(TO_TENSOR(img)))
            
            if (i + 1) % 2000 == 0 or (i + 1) == len(image_paths):
                print(f"  Processed [{i+1}/{len(image_paths)}] image tensors", flush=True)
        
        self.tensors = torch.stack(tensors)

    def __len__(self):
        return len(self.tensors)

    def __getitem__(self, idx):
        x = self.tensors[idx]
        y = self.labels[idx]
        
        if self.is_train:
            # Fast Tensor Data Augmentations
            if random.random() > 0.5:
                x = torch.flip(x, dims=[2]) # Horizontal Flip
            if random.random() > 0.7:
                x = torch.flip(x, dims=[1]) # Vertical Flip

        return x, y

def build_model(num_classes=4):
    try:
        weights = models.MobileNet_V3_Large_Weights.DEFAULT
        model = models.mobilenet_v3_large(weights=weights)
    except AttributeError:
        model = models.mobilenet_v3_large(pretrained=True)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model

def load_dataset():
    image_paths = []
    labels = []
    
    for c in CLASSES:
        cat_dir = os.path.join(DATA_DIR, c)
        if not os.path.exists(cat_dir):
            continue
        for fname in os.listdir(cat_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                image_paths.append(os.path.join(cat_dir, fname))
                labels.append(CLASS_TO_IDX[c])
                
    return image_paths, labels

def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device} (PyTorch Threads: {torch.get_num_threads()})", flush=True)

    image_paths, labels = load_dataset()
    print(f"Total dataset size: {len(image_paths)} images across classes: {CLASSES}", flush=True)

    # Stratified Train (80%), Val (10%), Test (10%) splits
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        image_paths, labels, test_size=0.20, random_state=SEED, stratify=labels
    )
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels, test_size=0.50, random_state=SEED, stratify=temp_labels
    )

    print(f"Train split: {len(train_paths)} | Val split: {len(val_paths)} | Test split: {len(test_paths)}", flush=True)

    with open(TEST_SPLIT_PATH, "w") as f:
        json.dump({"paths": test_paths, "labels": test_labels}, f, indent=2)
    print(f"Saved test dataset paths to {TEST_SPLIT_PATH}", flush=True)

    class_counts = np.bincount(train_labels, minlength=len(CLASSES))
    total_samples = len(train_labels)
    class_weights = total_samples / (len(CLASSES) * class_counts.astype(np.float32))
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device)
    print("Class distribution in training:", dict(zip(CLASSES, class_counts)), flush=True)
    print("Calculated Loss Class Weights:", dict(zip(CLASSES, np.round(class_weights, 3))), flush=True)

    print("\n--- Initializing Lightning-Fast Tensor Datasets ---", flush=True)
    train_dataset = FastTensorDataset(train_paths, train_labels, is_train=True)
    val_dataset = FastTensorDataset(val_paths, val_labels, is_train=False)

    batch_size = 64
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = build_model(num_classes=len(CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    epochs = 10
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    print("\n--- Starting Lightning-Fast Training Loop ---", flush=True)
    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, targets in train_loader:
            images, targets = images.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == targets).sum().item()
            total += targets.size(0)

        scheduler.step()
        epoch_train_loss = running_loss / total
        epoch_train_acc = correct / total

        # Validation Phase
        model.eval()
        val_running_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(device), targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)

                val_running_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == targets).sum().item()
                val_total += targets.size(0)

        epoch_val_loss = val_running_loss / val_total
        epoch_val_acc = val_correct / val_total

        history["train_loss"].append(epoch_train_loss)
        history["train_acc"].append(epoch_train_acc)
        history["val_loss"].append(epoch_val_loss)
        history["val_acc"].append(epoch_val_acc)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] | "
              f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc*100:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc*100:.2f}%", flush=True)

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_acc": best_val_acc,
                "classes": CLASSES
            }, MODEL_SAVE_PATH)
            print(f"  --> Saved new best model checkpoint to {MODEL_SAVE_PATH} (Val Acc: {best_val_acc*100:.2f}%)", flush=True)

    print(f"\nTraining completed successfully! Best Validation Accuracy: {best_val_acc*100:.2f}%", flush=True)

    # Plot metrics
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(range(1, epochs + 1), history["train_loss"], label="Train Loss", marker="o")
    plt.plot(range(1, epochs + 1), history["val_loss"], label="Val Loss", marker="o")
    plt.title("Loss per Epoch")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.grid(True)
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(range(1, epochs + 1), [acc * 100 for acc in history["train_acc"]], label="Train Acc (%)", marker="o")
    plt.plot(range(1, epochs + 1), [acc * 100 for acc in history["val_acc"]], label="Val Acc (%)", marker="o")
    plt.title("Accuracy (%) per Epoch")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy (%)")
    plt.grid(True)
    plt.legend()

    plt.tight_layout()
    plt.savefig(METRICS_PLOT_PATH)
    plt.close()
    print(f"Saved training metric curves plot to {METRICS_PLOT_PATH}", flush=True)

if __name__ == "__main__":
    train()
