import os
import tempfile
import unittest

import numpy as np
from PIL import Image

from split_fecal import discover, split_images


class SplitTests(unittest.TestCase):
    def test_duplicates_never_cross_splits(self):
        with tempfile.TemporaryDirectory() as root:
            paths, labels = [], []
            for cls, name in enumerate(('cocci', 'healthy', 'ncd', 'salmo')):
                os.mkdir(os.path.join(root, name))
                for i in range(30):
                    img = Image.fromarray(np.random.default_rng(cls * 100 + i).integers(
                        0, 256, (24, 24, 3), dtype=np.uint8))
                    path = os.path.join(root, name, f'{i}.png')
                    img.save(path)
                    paths.append(path)
                    labels.append(cls)
                duplicate = os.path.join(root, name, 'duplicate.png')
                img.save(duplicate)
                paths.append(duplicate)
                labels.append(cls)
            self.assertEqual(len(discover(root)[0]), len(paths))
            splits = split_images(paths, labels)
            self.assertEqual(sum(len(p) for p, _ in splits), len(paths))
            for cls in range(4):
                self.assertTrue(any(paths[31*cls+29] in part and paths[31*cls+30] in part
                                    for part, _ in splits))
            self.assertTrue(all(set(part_labels) == set(range(4)) for _, part_labels in splits))
            # A mislabeled copy must be investigated, not silently assigned to train/test.
            labels[-1] = 0
            with self.assertRaisesRegex(ValueError, 'conflicting labels'):
                split_images(paths, labels)


if __name__ == '__main__':
    unittest.main()
