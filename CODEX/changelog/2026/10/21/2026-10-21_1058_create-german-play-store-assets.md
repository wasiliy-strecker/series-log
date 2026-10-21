# Deutsche Play-Store-Grafiken für SerienLog

## Umsetzung

- 15 fertige Upload-Grafiken unter `store-assets/de-DE/`: vorhandenes Icon als quadratischer 512-Pixel-Export, Feature-Grafik, fünf Smartphone-Bilder und je vier Bilder für 7- und 10-Zoll-Tablets.
- Schwarz-rot-weiße Gestaltung mit Roboto und kurzen Nutzenüberschriften nach der ZählerstandLog-Referenz. Übersicht, Fotodetails, manuelle Erfassung, Verlauf und lokale Erinnerungen zeigen ausschließlich vorhandene Funktionen.
- Echte Aufnahmen aus drei eigenen leeren API-35-Emulatoren. Smartphone und 7-Zoll-Profil mit 1080 × 1920 Pixeln, 10-Zoll-Profil mit 1440 × 2560 Pixeln. Tablet-Bilder sind unveränderte RGB-Kopien ihrer jeweiligen Aufnahmen.
- Fiktive Daten über die App eingegeben. Eigenes vorhandenes Nordlichter-Beispielfoto verwendet. Drei Serien und fünf Folgenstände einschließlich Foto und Erinnerung über ein echtes verschlüsseltes Backup auf beide Tablets übertragen.
- App-lokale Aufnahme-, Layout- und Prüfwerkzeuge ergänzen AVD-Prüfung, Herkunft, Prüfsummen, deutsche Alt-Texte, Upload-Anleitung und gemeinsame Vorschau. Rohbilder, Backup und Build-Artefakte bleiben ignoriert.
- Für die vorhandenen x86_64-Emulatoren einmal eine passende Dev-Preview 1.0.0 (1) gebaut, da die vorhandene APK nur ARM64 enthielt. App-Code, Version, Nutzerinstallationen und Nachbarprojekte unverändert. Kein Store-Build, Upload oder Push.

## Prüfung

- `npm run check`: Prettier, ESLint, TypeScript und 82 Tests in 13 Testdateien erfolgreich.
- Vier Python-Werkzeugtests erfolgreich. Schutz vor physischen Geräten und fremden AVDs sowie Format-, Größen-, Transparenz- und Dateisatzprüfung abgedeckt.
- Python-Syntaxprüfung, `node --check` und `bash -n` erfolgreich.
- Alle 15 Upload-PNGs mit Pillow und ImageMagick vollständig dekodiert. Maße, Farbmodus, Alpha, Dateigröße, Alt-Text-Länge und Herkunft geprüft. Größte Upload-Datei: 674.910 Bytes.
- Aufnahmen und gemeinsame Vorschau visuell auf Lesbarkeit, tatsächliche Funktionen und störende Dialoge geprüft. Datum, Staffel und Folge sowie Foto und Verlaufsnotizen kontrolliert. Eingabeentwürfe nach der Aufnahme über die echte Oberfläche verworfen.
- Beide Backup-Importe und die gespeicherte normale Erinnerung freitags um 20:00 Uhr in der App geprüft. Keine allgemeine visuelle Regressionstestreihe.
