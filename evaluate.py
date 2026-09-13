import os
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image

CLASSES = ["cocci", "healthy", "ncd", "salmo"]
MODEL_PATH = "poultry_disease_model.pth"
TEST_SPLIT_PATH = "test_dataset.json"
CONF_MATRIX_PATH = "confusion_matrix.png"
ONNX_EXPORT_PATH = "poultry_disease_model.onnx"

NORMALIZE = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
TO_TENSOR = transforms.ToTensor()

class FastTestDataset(Dataset):
    def __init__(self, image_paths, labels):
        self.labels = torch.tensor(labels, dtype=torch.long)
        print(f"Pre-loading & converting {len(image_paths)} test images to Tensors...", flush=True)
        tensors = []
        for path in image_paths:
            try:
                img = Image.open(path).convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
            except Exception:
                img = Image.new("RGB", (224, 224), (0, 0, 0))
            tensors.append(NORMALIZE(TO_TENSOR(img)))
        self.tensors = torch.stack(tensors)

    def __len__(self):
        return len(self.tensors)

    def __getitem__(self, idx):
        return self.tensors[idx], self.labels[idx]

def load_model(num_classes=4):
    try:
        model = models.mobilenet_v3_large(weights=None)
    except Exception:
        model = models.mobilenet_v3_large(pretrained=False)

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model

def evaluate():
    if not os.path.exists(TEST_SPLIT_PATH):
        print(f"Error: Test split file {TEST_SPLIT_PATH} not found!", flush=True)
        return
    
    with open(TEST_SPLIT_PATH, "r") as f:
        test_data = json.load(f)
    
    test_paths = test_data["paths"]
    test_labels = test_data["labels"]

    test_dataset = FastTestDataset(test_paths, test_labels)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model(num_classes=len(CLASSES)).to(device)

    all_preds = []
    all_targets = []

    print("\nRunning Model Inference on Test Set...", flush=True)
    with torch.no_grad():
        for images, targets in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(targets.numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    display_names = ["Coccidiosis", "Healthy", "Newcastle Disease", "Salmonella"]

    print("\n=======================================================", flush=True)
    print("            POULTRY DISEASE MODEL REPORT               ", flush=True)
    print("=======================================================", flush=True)
    report = classification_report(all_targets, all_preds, target_names=display_names, digits=4)
    print(report, flush=True)

    # Save machine-readable report
    report_dict = classification_report(
        all_targets, all_preds, target_names=display_names, digits=4, output_dict=True
    )
    with open("evaluation_report.json", "w") as f:
        json.dump(report_dict, f, indent=2)
    print("Saved classification report to evaluation_report.json", flush=True)

    # Compute & Plot Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds)
    fig, ax = plt.subplots(figsize=(8, 7))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    
    ax.set(xticks=np.arange(cm.shape[1]),
           yticks=np.arange(cm.shape[0]),
           xticklabels=display_names, yticklabels=display_names,
           title='Confusion Matrix - Poultry Disease Diagnosis',
           ylabel='True Class Label',
           xlabel='Predicted Class Label')

    plt.setp(ax.get_xticklabels(), rotation=30, ha="right", rotation_mode="anchor")

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black",
                    fontsize=12, fontweight="bold")
    fig.tight_layout()
    plt.savefig(CONF_MATRIX_PATH)
    plt.close()
    print(f"Saved Confusion Matrix visualization to {CONF_MATRIX_PATH}", flush=True)

    # Export to ONNX
    print("\nExporting model to ONNX format...", flush=True)
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    try:
        torch.onnx.export(
            model,
            dummy_input,
            ONNX_EXPORT_PATH,
            export_params=True,
            opset_version=12,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
        )
        print(f"Successfully exported ONNX model to {ONNX_EXPORT_PATH}", flush=True)
    except Exception as e:
        print(f"ONNX Export Warning: {e}", flush=True)

if __name__ == "__main__":
    evaluate()
