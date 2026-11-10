import unittest

import numpy as np
from PIL import Image

from kaggle_fecal import KaggleFecalModel


class FakeInterpreter:
    def allocate_tensors(self):
        pass

    def get_input_details(self):
        return [{'shape': np.array([1, 224, 224, 3]), 'dtype': np.float32, 'index': 3}]

    def get_output_details(self):
        return [{'shape': np.array([1, 4]), 'dtype': np.float32, 'index': 9}]

    def set_tensor(self, index, value):
        assert index == 3
        self.input = value

    def invoke(self):
        pass

    def get_tensor(self, index):
        assert index == 9
        return np.array([[.1, .2, .3, .4]], dtype=np.float32)


class KaggleInferenceTests(unittest.TestCase):
    def test_offline_inference_preprocessing_and_order(self):
        interpreter = FakeInterpreter()
        model = KaggleFecalModel(interpreter=interpreter)
        image = Image.new('RGB', (250, 250), (225, 0, 0))
        scores = model.probabilities(image)
        self.assertEqual(interpreter.input.shape, (1, 224, 224, 3))
        np.testing.assert_allclose(interpreter.input[0, 0, 0], [1, 0, 0])
        np.testing.assert_allclose(scores, [.1, .2, .3, .4])
        self.assertEqual(np.argmax(scores), 3)  # salmo

    def test_invalid_output_rejected(self):
        class Bad(FakeInterpreter):
            def get_tensor(self, index):
                return np.array([[4., 1., 2., 1.]], dtype=np.float32)
        with self.assertRaisesRegex(ValueError, 'valid softmax'):
            KaggleFecalModel(interpreter=Bad()).probabilities(Image.new('RGB', (224, 224)))


if __name__ == '__main__':
    unittest.main()
