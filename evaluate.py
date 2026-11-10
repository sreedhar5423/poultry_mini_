"""Evaluate an untouched fecal test split and optionally promote the checkpoint.

Example: python evaluate.py --model fecal_candidate.pth --test-split fecal_candidate_test.json --deploy
"""
import argparse
import json
import os
import shutil

import torch
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
from train import CLASSES, FecalDataset, build_model


def evaluate(model_path, test_split, report_path, deploy=False):
    with open(test_split) as f:
        split = json.load(f)
    paths, labels = split['paths'], split['labels']
    if split.get('classes') != CLASSES:
        raise ValueError('Test split class order is missing or different from model class order')
    if not paths or len(paths) != len(labels) or not all(os.path.isfile(p) for p in paths):
        raise ValueError('Test split is empty, mismatched, or contains missing images')

    checkpoint = torch.load(model_path, map_location='cpu', weights_only=False)
    if checkpoint.get('classes') != CLASSES:
        raise ValueError('Checkpoint class order does not match the app')
    model = build_model(num_classes=len(CLASSES), pretrained=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    test = FecalDataset(paths, labels, is_train=False)
    predictions = []
    with torch.inference_mode():
        for images, _ in DataLoader(test, batch_size=32):
            predictions.extend(model(images).argmax(1).tolist())
    report = classification_report(labels, predictions, labels=list(range(len(CLASSES))),
                                   target_names=CLASSES, output_dict=True, zero_division=0)
    result = {
        'model': model_path, 'test_split': test_split,
        'samples': len(labels), 'test_report': report,
        'confusion_matrix': confusion_matrix(labels, predictions, labels=list(range(len(CLASSES)))).tolist(),
        'checkpoint_epoch': checkpoint['epoch'],
        'validation_accuracy': checkpoint['val_acc'],
        'validation_macro_f1': checkpoint['val_macro_f1'],
        'validation_loss': checkpoint['val_loss'],
    }
    with open(report_path, 'w') as f:
        json.dump(result, f, indent=2)
    print(classification_report(labels, predictions, labels=list(range(len(CLASSES))),
                                target_names=CLASSES, zero_division=0))
    print(f'Report saved to {report_path}')
    test_f1 = report['macro avg']['f1-score']
    val_f1 = checkpoint['val_macro_f1']
    passed = (test_f1 >= .80 and val_f1 >= .80 and abs(test_f1 - val_f1) <= .10
              and checkpoint['val_acc'] >= .80)
    print(f'Deployment gate: {"PASS" if passed else "FAIL"} (test macro F1 {test_f1:.3f}, '
          f'validation macro F1 {val_f1:.3f}; minimum .80, gap <= .10)')
    if deploy:
        if not passed:
            raise RuntimeError('Candidate failed the deployment gate; existing fecal model was not changed')
        target = os.path.join(os.path.dirname(__file__), 'poultry_disease_model.pth')
        if os.path.abspath(model_path) == os.path.abspath(target):
            raise ValueError('Evaluate a candidate checkpoint, not the deployed model')
        temp = target + '.tmp'
        shutil.copyfile(model_path, temp)
        os.replace(temp, target)
        print(f'Promoted candidate to {target}; restart the Flask backend to reload the model')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', default='fecal_candidate.pth')
    parser.add_argument('--test-split', default='fecal_candidate_test.json')
    parser.add_argument('--report', default='fecal_candidate_report.json')
    parser.add_argument('--deploy', action='store_true', help='Promote only if evaluation gate passes')
    args = parser.parse_args()
    evaluate(args.model, args.test_split, args.report, args.deploy)
