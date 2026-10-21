"""Focused checks for device isolation and upload validation."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from device import Device
from package import specifications, validate_image


class DeviceIsolationTest(unittest.TestCase):
    def test_rejects_physical_device_before_any_adb_call(self):
        with patch("device.subprocess.check_output") as command:
            with self.assertRaises(ValueError):
                Device("physical-phone")
            command.assert_not_called()

    def test_rejects_unrelated_emulator(self):
        with patch("device.subprocess.check_output", side_effect=[b"1\n", b"User_AVD\nOK\n"]):
            with self.assertRaises(ValueError):
                Device("emulator-5554")


class UploadValidationTest(unittest.TestCase):
    def test_expected_delivery_has_fifteen_unique_images(self):
        specs = list(specifications())
        self.assertEqual(15, len(specs))
        self.assertEqual(15, len({s[0] for s in specs}))
        self.assertTrue(all(len(s[-1]) <= 140 for s in specs))

    def test_rejects_wrong_dimensions_alpha_size_and_corruption(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "image.png"
            Image.new("RGB", (24, 32), "black").save(path)
            validate_image(path, (24, 32), "RGB", 10_000)
            for size, mode, limit in [((32, 24), "RGB", 10_000), ((24, 32), "RGBA", 10_000),
                                      ((24, 32), "RGB", 1)]:
                with self.assertRaises(ValueError):
                    validate_image(path, size, mode, limit)
            Image.new("RGBA", (24, 32), (0, 0, 0, 0)).save(path)
            with self.assertRaises(ValueError):
                validate_image(path, (24, 32), "RGBA", 10_000)
            path.write_bytes(b"not a PNG")
            with self.assertRaises(OSError):
                validate_image(path, (24, 32), "RGB", 10_000)


if __name__ == "__main__":
    unittest.main()
