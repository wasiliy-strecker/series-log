"""Validate and document the fifteen German Play upload images."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


PHONE = [
    ("01-uebersicht", "Serienübersicht mit Serientiteln, Foto und zuletzt gespeicherten Staffeln und Folgen."),
    ("02-seriendetails", "Seriendetails von Nordlichter mit eigenem Beispielfoto, Notiz und dem letzten Folgenstand."),
    ("03-folgenstand", "Manuelle Eingabe von Staffel und zuletzt gesehener Folge mit Datum und optionaler Notiz."),
    ("04-verlauf", "Gespeicherte Folgenstände von Nordlichter mit Datum, Notizen und Fotovorschau im Serienverlauf."),
    ("05-erinnerungen", "Persönliche lokale Erinnerung ans Weiterschauen mit wöchentlichem Intervall und eigener Uhrzeit."),
]
TABLET = [
    ("01-uebersicht", PHONE[0][1]),
    ("02-verlauf", PHONE[3][1]),
    ("03-folgenstand", PHONE[2][1]),
    ("04-erinnerungen", PHONE[4][1]),
]


def specifications():
    yield ("icon/serienlog-icon-512.png", "App-Symbol", (512, 512), "RGBA", 1_000_000,
           "SerienLog-Symbol mit rotem Bildschirm, weißem Wiedergabezeichen und dunklem Hintergrund.")
    yield ("feature/serienlog-feature-1024x500.png", "Vorstellungsgrafik", (1024, 500), "RGB", 15_000_000,
           "SerienLog: Wissen, wo du aufgehört hast. Staffel, Folge und Erinnerungen mit einer echten App-Ansicht.")
    for folder, field, size, items in [
        ("phone", "Smartphone-Screenshots", (1080, 1920), PHONE),
        ("tablet7", "7-Zoll-Tablet-Screenshots", (1080, 1920), TABLET),
        ("tablet10", "10-Zoll-Tablet-Screenshots", (1440, 2560), TABLET),
    ]:
        for name, alt in items:
            yield (f"{folder}/{name}.png", field, size, "RGB", 8_000_000, alt)


def validate_image(path, size, mode, limit):
    with Image.open(path) as im:
        im.load()
        if im.format != "PNG" or im.size != size or im.mode != mode:
            raise ValueError(f"Invalid image format, dimensions or color mode: {path}")
        if mode == "RGBA" and im.getextrema()[3] != (255, 255):
            raise ValueError(f"Store icon must have an opaque full-square background: {path}")
        if "transparency" in im.info:
            raise ValueError(f"Unexpected transparency: {path}")
    length = path.stat().st_size
    if not 0 < length <= limit:
        raise ValueError(f"Image exceeds size limit: {path}")
    return {"width": size[0], "height": size[1], "mode": mode, "bytes": length,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    out = args.output
    specs = list(specifications())
    expected = {s[0] for s in specs}
    actual = {str(p.relative_to(out)) for folder in ["icon", "feature", "phone", "tablet7", "tablet10"]
              for p in (out / folder).glob("*.png")}
    if actual != expected:
        raise ValueError(f"Unexpected upload file set: missing={expected-actual}, extra={actual-expected}")
    entries = []
    for filename, field, size, mode, limit, alt in specs:
        if len(alt) > 140:
            raise ValueError(f"Alt text too long: {filename}")
        entries.append({"file": filename, "playConsoleField": field, "altText": alt,
                        **validate_image(out / filename, size, mode, limit)})
        folder, name = filename.split("/")
        if folder in ("phone", "tablet7", "tablet10"):
            raw_name = name
            if folder != "phone":
                raw_name = {"02-verlauf.png": "04-verlauf.png",
                            "04-erinnerungen.png": "05-erinnerungen.png"}.get(name, name)
            raw = Path("build/store-assets/raw") / folder / raw_name
            geometry = json.loads(raw.with_suffix(".json").read_text())
            if not geometry["avd"].startswith(f"sl_store_assets_{folder}_"):
                raise ValueError(f"Wrong source profile: {filename}")
            validate_image(raw, size, "RGB", 8_000_000)
            raw_hash = hashlib.sha256(raw.read_bytes()).hexdigest()
            if folder != "phone" and raw_hash != entries[-1]["sha256"]:
                raise ValueError(f"Tablet upload differs from actual capture: {filename}")
            entries[-1]["capture"] = {**geometry, "rawSha256": raw_hash}
    apk = Path("android/app/build/outputs/apk/dev/release/app-dev-release.apk")
    source = json.loads(Path("build/store-assets/raw/source.json").read_text())
    if source["apkSha256"] != hashlib.sha256(apk.read_bytes()).hexdigest():
        raise ValueError("Source APK changed after capture")
    manifest = {"locale": "de-DE", "source": source, "images": entries}
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    lines = ["# SerienLog – Store-Grafiken", "", "15 Upload-Dateien für den deutschen Google-Play-Eintrag.", "",
             "Die Reihenfolge in dieser Tabelle ist die Upload-Reihenfolge innerhalb des jeweiligen Feldes.", "",
             "| Datei | Play-Console-Feld | Maße | Dateigröße |",
             "| --- | --- | --- | --- |"]
    for e in entries:
        byte_text = f'{e["bytes"]:,}'.replace(',', '.')
        lines.append(f'| `{e["file"]}` | {e["playConsoleField"]} | {e["width"]} × {e["height"]} | {byte_text} Bytes |')
    lines += ["", "`VORSCHAU.png`, `README.md` und `manifest.json` dienen der Prüfung und werden nicht hochgeladen.",
              "Das optionale Video-Feld bleibt leer.", "", "## Alt-Texte", ""]
    for e in entries:
        lines += [f'### {e["file"]}', "", e["altText"], ""]
    lines += ["## Herkunft und Aufnahme", "",
              "App: SerienLog 1.0.0 (1), eigenständige Dev-Preview mit eingebettetem JavaScript und x86_64-Bibliotheken.",
              "Paket: `com.appfactory.series_log.dev`. Keine Store-AAB, keine neue Store-Version und kein Upload.",
              f'Quellstand: `{source["gitCommit"]}`. APK-Prüfsumme: `{source["apkSha256"]}`.', "",
              "Echte Android-Aufnahmen aus drei eigenen leeren API-35-Emulatoren mit deutscher Oberfläche, dunklem Theme und normaler Schriftgröße.",
              "Smartphone: 1080 × 1920 px bei 360 dpi. 7-Zoll-Profil: 1080 × 1920 px bei 240 dpi. 10-Zoll-Profil: 1440 × 2560 px bei 240 dpi.",
              "Smartphone-Überschriften beanspruchen 330 von 1920 Pixeln. Der vollständige Screenshot wird proportional auf 1550 Pixel Höhe verkleinert.",
              "Tablet-Bilder sind direkte Aufnahmen ohne Werbetext oder nachträgliche Layoutänderung.", "",
              "Die fiktiven Serien und Folgenstände wurden über die echte App-Oberfläche erfasst und über deren verschlüsseltes Backup auf die beiden Tablet-Emulatoren übertragen.",
              "Das Foto stammt aus `assets/photo-examples/01_tv_staffel_1_folge_5.png`. Eigenes synthetisches Motiv vom 14. Oktober 2026, Herkunft und Prompt unter `assets/photo-examples/` dokumentiert.",
              "Das bestehende Icon stammt aus `assets/icon.png`. Für Google Play wurde nur der Export auf 512 Pixel skaliert und der Hintergrund bis in die Ecken gefüllt.",
              "Die Roboto-Schriften und ihre Lizenz liegen unter `assets/ui/`.", "",
              "SerienLog speichert Staffel und Folge manuell. Bilder sind optionale Anhänge. Erinnerungen sind selbst eingestellte lokale Termine.",
              "Aufnahmehilfen und Reproduktionshinweise: `scripts/store_assets/README.md`. Rohbilder und AVD-Geometrien: `build/store-assets/raw/`.", "",
              "## Prüfung", "",
              "Alle 15 Upload-Dateien wurden vollständig als PNG dekodiert und auf Maße, Farbmodus, Transparenz, Dateigröße und Alt-Text-Länge geprüft.",
              "Das Manifest enthält SHA-256-Prüfsummen. Die gemeinsame Vorschau unterstützt die zusätzliche Sichtprüfung aller Motive.", "",
              "[Google-Play-Vorgaben](https://support.google.com/googleplay/android-developer/answer/9866151?hl=de)", ""]
    (out / "README.md").write_text("\n".join(lines))
    print(f"Validated {len(entries)} upload PNGs. Largest: {max(e['bytes'] for e in entries):,} bytes.")


if __name__ == "__main__":
    main()
