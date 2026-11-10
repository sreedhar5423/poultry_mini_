"""Leakage-resistant splits for the Kaggle fecal-image dataset.

Group identical and near-identical pictures before assigning train/validation/test.
The test partition is never used to choose an epoch or tune hyperparameters.
"""
import hashlib
import os
from collections import Counter, defaultdict

import numpy as np
from PIL import Image, ImageOps
from sklearn.model_selection import train_test_split

CLASSES = ("cocci", "healthy", "ncd", "salmo")
EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp")


def discover(data_dir):
    # Kagglehub sometimes returns the parent folder of poultry_diseases.
    if not all(os.path.isdir(os.path.join(data_dir, c)) for c in CLASSES):
        data_dir = os.path.join(data_dir, "poultry_diseases")
    if not all(os.path.isdir(os.path.join(data_dir, c)) for c in CLASSES):
        raise ValueError(f"Expected cocci/healthy/ncd/salmo under {data_dir}")
    paths, labels = [], []
    for i, name in enumerate(CLASSES):
        for root, _, files in os.walk(os.path.join(data_dir, name)):
            for file in sorted(files):
                if file.lower().endswith(EXTENSIONS):
                    path = os.path.join(root, file)
                    try:
                        with Image.open(path) as image:
                            image.verify()
                        paths.append(path)
                        labels.append(i)
                    except (OSError, ValueError):
                        print(f"Skipping unreadable image: {path}", flush=True)
    if not paths:
        raise ValueError(f"No readable images found under {data_dir}")
    return paths, labels


def _dhash(path):
    with Image.open(path) as image:
        gray = ImageOps.exif_transpose(image).convert("L").resize((9, 8))
        pixels = np.asarray(gray)
    bits = pixels[:, 1:] > pixels[:, :-1]
    return int(''.join('1' if b else '0' for b in bits.flat), 2)


def split_images(paths, labels, seed=42):
    """Return three (paths, labels) pairs; near duplicates stay in one partition.

    Exact SHA duplicates and dHash distance <=2 are unioned. dHash is a
    conservative heuristic, not a guarantee of detecting all visual duplicates.
    Cross-class duplicates are rejected: they cannot be safely evaluated.
    """
    parent = list(range(len(paths)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(a, b):
        parent[find(a)] = find(b)

    exact, hashes = {}, defaultdict(list)
    for i, path in enumerate(paths):
        with open(path, 'rb') as f:
            digest = hashlib.file_digest(f, 'sha256').digest()
        if digest in exact:
            union(i, exact[digest])
        else:
            exact[digest] = i
        h = _dhash(path)
        # All hashes within Hamming distance 2 share at least one of three
        # 22/21/21-bit blocks; bucket lookups avoid quadratic full comparisons.
        for block, shift, mask in ((0, 0, (1 << 22) - 1),
                                    (1, 22, (1 << 21) - 1),
                                    (2, 43, (1 << 21) - 1)):
            key = (block, (h >> shift) & mask)
            for other_hash, j in hashes[key]:
                if (h ^ other_hash).bit_count() <= 2:
                    union(i, j)
            hashes[key].append((h, i))

    groups = defaultdict(list)
    for i in range(len(paths)):
        groups[find(i)].append(i)
    conflicts = [g for g in groups.values() if len({labels[i] for i in g}) > 1]
    if conflicts:
        raise ValueError(f"{len(conflicts)} duplicate groups have conflicting labels; inspect the dataset before training: "
                         + str([[paths[i] for i in g[:3]] for g in conflicts[:3]]))

    group_list = list(groups.values())
    group_labels = [labels[g[0]] for g in group_list]
    counts = Counter(group_labels)
    if any(counts.get(i, 0) < 10 for i in range(len(CLASSES))):
        raise ValueError(f"At least 10 independent image groups per class required: {counts}")
    train_g, holdout_g = train_test_split(
        np.arange(len(group_list)), test_size=.2, stratify=group_labels, random_state=seed)
    hold_labels = [group_labels[i] for i in holdout_g]
    val_g, test_g = train_test_split(
        holdout_g, test_size=.5, stratify=hold_labels, random_state=seed)

    def expand(indices):
        members = [i for group_id in indices for i in group_list[group_id]]
        return [paths[i] for i in members], [labels[i] for i in members]

    print(f"Grouped {len(paths)} images into {len(group_list)} independent groups", flush=True)
    return expand(train_g), expand(val_g), expand(test_g)
