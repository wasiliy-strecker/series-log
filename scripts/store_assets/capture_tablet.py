"""Capture four real tablet views after importing the fictional demo backup."""
import argparse
from pathlib import Path

from capture import Capture


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("serial")
    parser.add_argument("profile", choices=["tablet7", "tablet10"])
    args = parser.parse_args()
    c = Capture(args.serial)
    avd = c.run("emu", "avd", "name").decode().splitlines()[0]
    if not avd.startswith(f"sl_store_assets_{args.profile}_"):
        raise ValueError("The requested tablet profile does not match the actual AVD")
    folder = Path("build/store-assets/raw") / args.profile
    c.start()
    c.capture(folder / "01-uebersicht.png")
    c.reveal("Nordlichter")
    c.tap("Nordlichter")
    c.reveal("Serienverlauf")
    c.swipe()
    c.capture(folder / "04-verlauf.png")
    c.tap("Folgenstand erfassen")
    c.tap("Ohne Foto erfassen")
    c.field("Zuletzt gesehene Folge *", "6")
    c.set_date("20.10.2026", "21", "00")
    c.field("Notiz (optional)", "Weiter geht es am Fjord.")
    c.top()
    c.capture(folder / "03-folgenstand.png")
    c.back()
    c.tap("Folgenstand verwerfen")
    c.start()
    c.reveal("Am Meer")
    c.tap("Am Meer")
    c.reveal("Serie & Erinnerung bearbeiten")
    c.tap("Serie & Erinnerung bearbeiten")
    c.capture(folder / "05-erinnerungen.png")
    c.back()
    print(f"Captured four views for {args.profile}", flush=True)


if __name__ == "__main__":
    main()
