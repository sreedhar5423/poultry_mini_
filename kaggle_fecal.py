"""Offline inference for Kausthub Kannan's fecal MobileNetV2 (TFLite export).

The original Kaggle Keras model uses a TensorFlow Hub layer. Exporting it to
TFLite once on Kaggle packages the weights for inference without a Hub request.
"""
import os
import threading

import numpy as np
from PIL import Image, ImageOps

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'weights', 'kaggle_fecal.tflite')
CLASSES = ('cocci', 'healthy', 'ncd', 'salmo')  # flow_from_directory alphabetical order


class KaggleFecalModel:
    architecture = 'Kaggle MobileNetV2 (offline TFLite)'

    def __init__(self, path=MODEL_PATH, interpreter=None):
        if interpreter is None:
            if not os.path.isfile(path):
                raise FileNotFoundError(f'Kaggle fecal model not installed: {path}. See README_TRAINING.md')
            try:
                from tflite_runtime.interpreter import Interpreter
            except ImportError:
                try:
                    from tensorflow.lite import Interpreter  # Windows fallback, also offline
                except ImportError as exc:
                    raise RuntimeError('Install tflite-runtime (Linux) or tensorflow to use the offline Kaggle fecal model') from exc
            interpreter = Interpreter(model_path=path, num_threads=2)
        self.interpreter = interpreter
        self.lock = threading.Lock()  # Interpreter is not safe for concurrent Flask requests
        self.interpreter.allocate_tensors()
        self.input = self.interpreter.get_input_details()[0]
        self.output = self.interpreter.get_output_details()[0]
        if (tuple(self.input['shape'][1:]) != (224, 224, 3)
                or self.input['dtype'] != np.float32
                or tuple(self.output['shape'][1:]) != (4,)):
            raise ValueError('Unexpected Kaggle TFLite input/output shape or dtype')

    @staticmethod
    def _prepare(image):
        # The notebook trained with ImageDataGenerator(rescale=1/225.), NOT
        # ImageNet mean/std normalization used by the old PyTorch model.
        if isinstance(image, str):
            with Image.open(image) as src:
                image = ImageOps.exif_transpose(src).convert('RGB')
        elif isinstance(image, np.ndarray):
            # OpenCV arrays in this app use BGR ordering.
            image = Image.fromarray(image[..., ::-1]).convert('RGB')
        else:
            image = ImageOps.exif_transpose(image).convert('RGB')
        image = image.resize((224, 224), Image.Resampling.BILINEAR)
        return np.asarray(image, dtype=np.float32)[None, ...] / 225.0

    def probabilities(self, image):
        batch = self._prepare(image)
        with self.lock:
            # Some exports have a dynamic batch dimension; this app always
            # predicts one image at a time so no interpreter resize is needed.
            self.interpreter.set_tensor(self.input['index'], batch)
            self.interpreter.invoke()
            result = np.asarray(self.interpreter.get_tensor(self.output['index']))[0]
        if (not np.all(np.isfinite(result)) or np.any(result < 0)
                or not np.isclose(result.sum(), 1.0, atol=0.02)):
            raise ValueError('Kaggle model did not produce four valid softmax probabilities')
        return result / result.sum()
