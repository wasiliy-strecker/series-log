"""Focused checks for device isolation and upload validation."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from device import Device
from package import NAMES, validate


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
    def test_expected_delivery_has_six_phone_and_four_tablet_images(self):
        self.assertEqual(6, len(NAMES))
        self.assertEqual(6, len(set(NAMES)))
        self.assertEqual(16, 2 + len(NAMES) + 4 + 4)

    def test_rejects_wrong_dimensions_alpha_size_and_corruption(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "image.png"
            Image.new("RGB", (24, 32), "black").save(path)
            validate(path, (24, 32), "RGB", 10_000)
            for size, mode, limit in [((32, 24), "RGB", 10_000), ((24, 32), "RGBA", 10_000),
                                      ((24, 32), "RGB", 1)]:
                with self.assertRaises(ValueError):
                    validate(path, size, mode, limit)
            Image.new("RGBA", (24, 32), (0, 0, 0, 0)).save(path)
            with self.assertRaises(ValueError):
                validate(path, (24, 32), "RGBA", 10_000)
            path.write_bytes(b"not a PNG")
            with self.assertRaises(OSError):
                validate(path, (24, 32), "RGB", 10_000)


if __name__ == "__main__":
    unittest.main()
