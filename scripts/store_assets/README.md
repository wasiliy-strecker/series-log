# Internationale SerienLog-Store-Bilder

App-lokale Aufnahme-, Layout- und Prüfwerkzeuge für die sechs Sprachpakete von
SerienLog 1.0.0 (2). Ablauf und Datenkompatibilität stehen in
[INTERNATIONAL_RELEASE.md](../../docs/INTERNATIONAL_RELEASE.md).

## Voraussetzungen

Node 22 oder neuer, Python mit Pillow, ImageMagick, Chrome, JDK 21,
Android SDK mit API-35-Google-APIs-x86_64, KVM und Bundletool 1.18.3.
`SL_ANDROID_SDK`, `SL_ADB`, `SL_EMULATOR_PORT` und `BUNDLETOOL_JAR` können
lokale Standardpfade überschreiben. Alle Befehle laufen aus dem App-Verzeichnis.

## Isolierte Aufnahmen

`fixture.test.ts` erstellt synthetische Backups mit den Produktionsservices.
`extract_apk.sh` leitet eine lokal signierte Store-APK aus der ausdrücklich
angegebenen finalen AAB ab. Der Inhalt wird byteweise gegen die AAB geprüft.
`run_capture.py` erstellt für genau eine Sprache und ein Geräteprofil ein neues
AVD unter `/dev/shm`. Unterschiedliche Sitzungen brauchen freie gerade Ports.
Die reale Systemregion wird vor der App-Installation gesetzt.

| Profil   | Pixel       | Dichte  | Logische Breite |
| -------- | ----------- | ------- | --------------- |
| phone    | 1080 × 1920 | 300 dpi | 576 dp          |
| tablet7  | 1200 × 1920 | 320 dpi | 600 dp          |
| tablet10 | 1600 × 2560 | 320 dpi | 800 dp          |

Die Tabletprofile verwenden Nexus 7 (2013) und Nexus 10 im Hochformat.
Jede Aufnahme zeigt die tatsächliche App auf dem jeweiligen Profil. Alle Profile
verwenden das vorhandene dunkle Design und normale Schriftgröße. Die synthetische
Statusleiste zeigt 09:41 Uhr. Das AVD läuft zusätzlich im Flugmodus.

`Device` akzeptiert nur explizite Emulator-Seriennummern und eigene
`sl_store_assets`-AVDs. Aufnahme, Installation und Beenden dürfen keine anderen
Geräte adressieren. Erfolgreiche temporäre AVDs werden entfernt. Fehlgeschlagene
Sitzungen bleiben mit Logs zur Diagnose erhalten.

## Gestaltung und Prüfung

`render.mjs` erzeugt die 16 Upload-Bilder pro Sprache und eine Kontaktübersicht.
Icon, Roboto, dunkler Hintergrund und rote Akzente bleiben erhalten.
Die echte App-Aufnahme wird proportional skaliert. Beschriftungen stehen außerhalb
von ihr. Keine UI nachbauen, Texte retuschieren oder Scrollpositionen zusammensetzen.

`package.py` validiert 96 Upload-Dateien, Textgrenzen und Aufnahmenherkunft.
Es erzeugt sechs Sprach-ZIPs und ein Gesamt-ZIP mit AAB, Vorschauen, kopierbaren
Textfeldern, Release-Notizen, Prüfsummen und Herkunftsmanifesten. Bereits vorhandene
benannte ZIP-Lieferungen werden nicht überschrieben. Alle Bilder zusätzlich visuell
auf Lesbarkeit, richtige Sprache und unerwünschte Dialoge prüfen.

```bash
python3 -m unittest discover -s scripts/store_assets -p 'test_*.py'
python3 -m py_compile scripts/store_assets/*.py
node --check scripts/store_assets/render.mjs
bash -n scripts/store_assets/prepare_emulator.sh scripts/store_assets/extract_apk.sh
```

Ausgaben unter `releases/` bleiben außerhalb von Git. Rohbilder und Demo-Backups
sind keine Store-Uploads. Das Video-Feld bleibt leer. Kein Push oder Upload.
