"""Run on Kaggle with TensorFlow + tensorflow_hub and model.hdf5 available.

After export, download kaggle_fecal.tflite and copy to weights/ in the app.
No dataset is needed to perform this one-time conversion, but an independent
labeled image set IS needed to assess whether it should be deployed.
"""
import argparse
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub


def export(source, dest):
    # TF Hub custom layer is required to deserialize the original Keras file;
    # conversion embeds the layer weights in the portable TFLite artifact.
    model = tf.keras.models.load_model(source, custom_objects={'KerasLayer': hub.KerasLayer}, compile=False)
    if tuple(model.input_shape[1:]) != (224, 224, 3) or model.output_shape[-1] != 4:
        raise ValueError('Unexpected notebook model shape; do not deploy')
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    data = converter.convert()  # default float32; do not change preprocessing/quantization
    interpreter = tf.lite.Interpreter(model_content=data)
    interpreter.allocate_tensors()
    inputs, outputs = interpreter.get_input_details()[0], interpreter.get_output_details()[0]
    if (tuple(inputs['shape']) != (1, 224, 224, 3) or inputs['dtype'] != np.float32
            or tuple(outputs['shape']) != (1, 4)):
        raise ValueError('Unexpected TFLite signature; do not deploy')
    # Sanity check equivalence on a deterministic synthetic image; this is NOT
    # an accuracy test. For accuracy, use real held-out fecal photographs.
    sample = np.random.default_rng(42).uniform(0, 255, (1, 224, 224, 3)).astype(np.float32) / 225.
    expected = model(sample, training=False).numpy()
    interpreter.set_tensor(inputs['index'], sample)
    interpreter.invoke()
    actual = interpreter.get_tensor(outputs['index'])
    if not np.allclose(expected, actual, atol=.02, rtol=.02):
        raise ValueError('Keras/TFLite output mismatch; do not deploy')
    with open(dest, 'wb') as f:
        f.write(data)
    print(f'Exported {dest} ({len(data)} bytes); verify on held-out real images before deployment')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', help='Kaggle notebook output model.hdf5')
    parser.add_argument('dest', nargs='?', default='kaggle_fecal.tflite')
    args = parser.parse_args()
    export(args.source, args.dest)
