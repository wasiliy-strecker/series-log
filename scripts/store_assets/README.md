# SerienLog Store-Grafiken

App-lokale Aufnahme-, Layout- und Prüfwerkzeuge. Die App-Oberfläche und ihre
Funktionen bleiben unverändert. Alle Daten sind fiktiv. MaschinenLog dient als
technische Vorlage, ZählerstandLog als Referenz für kurze Nutzenüberschriften.
Es gibt keine Runtime-Abhängigkeit zu diesen Projekten.

## Voraussetzungen und Quelle

Node 22 oder neuer, Python mit Pillow, ImageMagick, Google Chrome, JDK 21,
Android SDK und das vorhandene API-35-Image `google_apis/x86_64`.
Alle Befehle aus dem SerienLog-Verzeichnis ausführen.

Die zum Auftrag vorhandene Dev-Preview enthielt nur ARM64. Für die x86_64-AVDs
wurde deshalb einmal eine eigenständige Dev-Preview erzeugt:

```bash
npm run build:preview -- -PreactNativeArchitectures=x86_64
```

Das ist `devRelease`, Paket `com.appfactory.series_log.dev`, Version 1.0.0 (1).
Das APK besitzt eingebettetes JavaScript, kein Debug-Flag und keine
Netzwerkberechtigungen. Es wird keine Store-AAB oder Store-APK gebaut.
Version, Paket und SHA-256 stehen in `build/store-assets/raw/source.json`
und werden ins Liefermanifest übernommen.

## Eigene Emulatoren

Jeder Aufruf erstellt ein neues leeres AVD in einem eigenen temporären
Verzeichnis unter `/dev/shm`. Bestehende AVDs werden nicht kopiert oder benutzt.
Belegte Emulator-Ports werden abgelehnt. Die Sitzungen bleiben bis zum Beenden
der eigenen Emulatoren geöffnet.

```bash
bash scripts/store_assets/prepare_emulator.sh phone
SL_EMULATOR_PORT=5590 bash scripts/store_assets/prepare_emulator.sh tablet7
SL_EMULATOR_PORT=5592 bash scripts/store_assets/prepare_emulator.sh tablet10
```

| Profil         | Auflösung   | Dichte  | Logische Breite |
| -------------- | ----------- | ------- | --------------- |
| Smartphone     | 1080 × 1920 | 360 dpi | 480 dp          |
| 7-Zoll-Tablet  | 1080 × 1920 | 240 dpi | 720 dp          |
| 10-Zoll-Tablet | 1440 × 2560 | 240 dpi | 960 dp          |

Die Tablet-Profile basieren auf Nexus 7 und Nexus 10 mit 9:16-Display.
Sprache Deutsch, Zeitzone Europe/Berlin, dunkles Theme, normale Schriftgröße.
`device.py` akzeptiert ausschließlich Emulator-Seriennummern und prüft
`ro.kernel.qemu` sowie den AVD-Präfix `sl_store_assets` vor der Bedienung.
Das Präparationsskript prüft außerdem, dass noch kein SerienLog installiert ist.

Nach der Prüfung ausschließlich die ausgegebenen eigenen Seriennummern
verwenden. Der bestehende Installer prüft Paket, Version, Debug-Status und bei
vorhandenen Installationen auch Installer und Signatur vor einem Update:

```bash
python3 scripts/store_assets/device.py emulator-5588 status
npm run install:preview -- emulator-5588
```

Für die beiden anderen eigenen AVDs dieselben Befehle mit deren Seriennummern
ausführen. `status` setzt Androids echte Demostatusleiste auf 09:41 Uhr.
Es ist keine Bildretusche. Niemals ein physisches Gerät als Ziel verwenden.

## Fiktive Daten und Motive

`capture.py` bietet kleine UI-Helfer für Texteingabe, Datumsauswahl, Scrollen
und Aufnahme. Es gibt keinen App-Demomodus und keinen Datenbankzugriff.
Der Aufnahmeablauf verwendet ausschließlich die echte Oberfläche.

Nordlichter erhält Staffel 1, Folgen 3, 4 und 5 vom 18., 19. und 20. Oktober
2026 um 20:15 Uhr. Kurze Notizen erläutern die Serienabende.
Am Meer zeigt Staffel 2, Folge 3 vom 19. Oktober. Nachtschicht zeigt Staffel 3,
Folge 8 vom 20. Oktober, jeweils um 20:15 Uhr. Am Meer erhält eine normale
lokale Erinnerung am Freitag um 20:00 Uhr.

Das vorhandene synthetische Foto aus
`assets/photo-examples/01_tv_staffel_1_folge_5.png` wird nach
`/sdcard/Pictures/Nordlichter.png` kopiert, per Android-Medienscanner bekannt
gemacht und über den normalen Galerie-Dialog an Folge 5 angehängt.
Das Original zeigt genau Staffel 1, Folge 5. Herkunft und Prompt sind in
`assets/photo-examples/` dokumentiert. Neue Bildgenerierung ist nicht nötig.

Über Einstellungen → Verschlüsseltes Backup erstellen ein echtes `.slbackup`
mit dem öffentlichen Demopasswort `Demo2026` speichern. Nur diese fiktive
Sicherung nach `build/store-assets/raw/demo/` ziehen und auf die Tablet-AVDs
kopieren. Dort über Backup wiederherstellen und Android-Dateiauswahl importieren.
Nach dem Import die eigene Emulator-App neu öffnen und die Serien prüfen.

Smartphone-Rohbilder unter `build/store-assets/raw/phone/`:

| Datei                  | Reale Ansicht                                                   |
| ---------------------- | --------------------------------------------------------------- |
| `01-uebersicht.png`    | Übersicht mit Foto und mehreren Serien                          |
| `02-seriendetails.png` | Nordlichter mit großem Foto und letztem Folgenstand             |
| `03-folgenstand.png`   | Manuelles Formular, Staffel 1 und Folge 6, Tastatur geschlossen |
| `04-verlauf.png`       | Zum Verlauf gescrollte Seriendetails mit drei Folgenständen     |
| `05-erinnerungen.png`  | Wöchentlicher selbst gewählter Erinnerungstermin                |

Auf jedem Tablet Übersicht, Verlauf, Erfassung und Erinnerungen separat
aufnehmen. Die Rohbilder heißen wie die entsprechenden Smartphone-Motive und
liegen unter `raw/tablet7/` beziehungsweise `raw/tablet10/`. Der Export nummeriert
diese vier Dateien je Tablet neu von 01 bis 04.

Nach dem erfolgreichen Backup-Import lässt sich diese Navigation ausführen:

```bash
python3 scripts/store_assets/capture_tablet.py emulator-5590 tablet7
python3 scripts/store_assets/capture_tablet.py emulator-5592 tablet10
```

Die Erfassung zeigt Staffel 1, Folge 6 am 20. Oktober um 21:00 Uhr als
ungespeicherten Entwurf. Die Smartphone-Übersicht wird etwas nach unten
gescrollt, damit alle drei Serientitel und Folgenstände gemeinsam sichtbar sind.

`Capture.capture` speichert außerdem die tatsächliche Geometrie, den
AVD-Namen und das Paket in einer JSON-Datei neben jedem Rohbild.
Keine UI nachbauen, Inhalte retuschieren oder mehrere Scrollpositionen
zusammensetzen. Ein Erfassungsentwurf wird nach der Aufnahme über den echten
Verwerfen-Dialog entfernt. Keine Entwürfe in der Serienübersicht zeigen.

## Gestaltung, Prüfung und Lieferung

```bash
node scripts/store_assets/render.mjs assets store-assets/de-DE
node scripts/store_assets/render.mjs contact store-assets/de-DE
python3 scripts/store_assets/package.py store-assets/de-DE
python3 -m unittest discover -s scripts/store_assets -p 'test_*.py'
node --check scripts/store_assets/render.mjs
bash -n scripts/store_assets/prepare_emulator.sh
```

Das Layout wird als HTML/CSS gerendert. Bestehendes Icon, Roboto und SerienLogs
Farben `#0C0C0F`, `#E50914` und `#FAFAFA` bleiben die Grundlage. Der Icon-Export
erhält einen vollständig gefüllten quadratischen Hintergrund. Die App-Assets
werden nicht verändert.

Smartphone-Header: 330 von 1920 Pixeln. Die vollständige App-Aufnahme wird
proportional auf 1550 Pixel Höhe skaliert. Tablets erhalten keine Überschrift,
keinen Geräterahmen und keine nachträgliche Layoutänderung.

Der Paketierer prüft exakt 15 Upload-Dateien, vollständige PNG-Dekodierung,
Maße, RGB ohne Alpha für Screenshots und Feature-Grafik, RGBA mit vollständig
deckendem Hintergrund fürs Icon, Dateigrößen und Alt-Text-Längen. Er erzeugt
README, Feldzuordnung und Prüfsummenmanifest. Jede Datei zusätzlich einmal
visuell auf Lesbarkeit, echte Funktionen und unerwünschte Dialoge prüfen.
Eine allgemeine visuelle Regressionstestreihe ist nicht vorgesehen.

Die finalen Assets liegen versioniert unter `store-assets/de-DE/`. Rohbilder,
AVD-Daten, APKs und HTML-Arbeitsdateien bleiben außerhalb von Git.
Nur die selbst gestarteten und anhand ihres Namens geprüften Emulatoren beenden.
Den Ausgabeordner öffnen. Kein Upload, Push oder Store-Build.

[Google-Play-Vorgaben](https://support.google.com/googleplay/android-developer/answer/9866151?hl=de)
