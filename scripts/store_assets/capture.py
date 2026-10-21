"""Small UI helpers for the actual SerienLog app on dedicated screenshot AVDs."""
from pathlib import Path
import json
import re
import shlex
import subprocess
import time

from device import Device

PACKAGE = "com.appfactory.series_log.dev"


class Capture(Device):
    def __init__(self, serial):
        super().__init__(serial)
        size = self.run("shell", "wm", "size").decode().splitlines()[-1]
        self.width, self.height = map(int, re.findall(r"(\d+)x(\d+)", size)[0])

    def start(self):
        self.run("shell", "am", "force-stop", PACKAGE)
        self.run("shell", "am", "start", "-n", PACKAGE + "/com.appfactory.series_log.MainActivity")
        time.sleep(2)

    def has(self, label):
        return any(label in (n.get("text", ""), n.get("content-desc", ""))
                   and self.visible(n) for n in self.nodes())

    def visible(self, node):
        a, b, c, d = map(int, re.findall(r"\d+", node.get("bounds")))
        return c > a and d - b > 10 and b > 0 and d < self.height

    def back(self):
        self.run("shell", "input", "keyevent", "4")
        time.sleep(.5)

    def swipe(self, up=True):
        x = str(self.width // 2)
        a, b = int(self.height * .78), int(self.height * .28)
        if not up:
            a, b = b, a
        self.run("shell", "input", "swipe", x, str(a), x, str(b), "400")
        time.sleep(.4)

    def reveal(self, label):
        for _ in range(10):
            if self.has(label):
                return
            self.swipe()
        raise ValueError(f"Could not reveal {label}")

    def field(self, label, value, clear=True, dismiss=True):
        self.reveal(label)
        self.tap(label)
        if clear:
            self.run("shell", "input", "keycombination", "113", "29")
            self.run("shell", "input", "keyevent", "KEYCODE_DEL")
            time.sleep(.35)  # Let the controlled React Native input apply the deletion.
        self.run("shell", "input", "text", shlex.quote(value.replace(" ", "%s")))
        time.sleep(.35)
        if dismiss:
            self.back()

    def capture(self, path):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        time.sleep(1.5)
        path.write_bytes(self.run("exec-out", "screencap", "-p"))
        subprocess.run(["convert", str(path), f"PNG24:{path}"], check=True)
        path.with_suffix(".json").write_text(json.dumps({
            "serial": self.serial,
            "avd": self.run("emu", "avd", "name").decode().splitlines()[0],
            "size": self.run("shell", "wm", "size").decode().strip(),
            "density": self.run("shell", "wm", "density").decode().strip(),
            "package": PACKAGE,
        }, indent=2) + "\n")
        print(path, flush=True)

    def top(self):
        for _ in range(5):
            self.swipe(False)

    def dump(self):
        for node in self.nodes():
            label = node.get("text") or node.get("content-desc")
            if label:
                print(node.get("bounds"), repr(label), flush=True)

    def set_date(self, date, hour="20", minute="15"):
        self.reveal("Datum auswählen")
        self.tap("Datum auswählen")
        self.tap("Datum eingeben")
        self.field("Datum", date, dismiss=False)
        self.tap("OK")
        self.tap("Uhrzeit eingeben")
        self.field("Stunde", hour, dismiss=False)
        self.field("Minute", minute, dismiss=False)
        self.tap("OK")

    def save_entry(self):
        self.reveal("Folgenstand speichern")
        self.tap("Folgenstand speichern")
        time.sleep(3)

    def create_record(self, name, note=""):
        self.start()
        self.tap("Serie anlegen")
        self.field("Serientitel *", name)
        if note:
            self.field("Notiz (optional)", note)
        self.tap("Serie speichern")
        time.sleep(3)

    def manual_entry(self, season, episode, date, note="Serienabend"):
        self.tap("Folgenstand erfassen")
        self.tap("Ohne Foto erfassen")
        self.field("Staffel *", str(season))
        self.field("Zuletzt gesehene Folge *", str(episode))
        self.set_date(date)
        if note:
            self.field("Notiz (optional)", note)
        self.save_entry()
