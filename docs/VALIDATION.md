# Prüfung der ersten SerienLog-Version

## Ausgeführt

`npm run check`: Formatierung, ESLint, TypeScript und 13 gezielte Tests für
Folgenberechnung, optionale Gesamtzahlen, Staffelwechsel, Rücksprünge,
SQLite-Persistenz, Suche, Paginierung, Korrekturen, Dateireferenzen, PDF-Erzeugung
und verschlüsselte Backups. Die Backup-Prüfung nutzt echte JPEG-/PDF-Dateien
und verifiziert die Verschlüsselung zusätzlich mit Node/OpenSSL.

`npm run check:native`: 38 vorhandene, auf SerienLog angepasste JVM-Tests für
Erinnerungen, Zeitzonen, Android-Berechtigungen, Dateizugriff und
Passwortableitung bestanden. Android-Lint für das eigene Modul bestanden.
Die bereits in der Vorlage dokumentierten Lint-Abstürze zweier Expo-/Worklets-
Abhängigkeiten werden im übernommenen Skript gezielt ausgeschlossen.

`expo prebuild`: Eigene Android-Kennungen, Expo-Modul, Icon, Startfarben und
getrennte Dev-/Store-Varianten erzeugt. Kein Store-Debug. Kein APK oder AAB für
den Store erstellt. Keine Installation, kein Upload und kein Push.

`npx expo export --platform android --output-dir build/bundle-check`: Android-
JavaScript-Bündel mit Metro und Hermes erfolgreich erzeugt. Das ist kein APK-
oder Store-Build.

## Kurze manuelle Abnahme auf einem Gerät

Die vollständige manuelle Abnahme steht noch aus. Schritt 10 wurde auf einem
verbundenen Android-Smartphone geprüft. Es wurde keine umfangreiche visuelle
Testreihe gestartet.

1. Serie mit Titel und Genre anlegen. Gesamtfolgenzahl offen lassen.
2. Staffel 1, Folge 3 ohne Foto speichern. Drei Folgen ohne Prozentwert prüfen.
3. Staffel 1 mit acht Folgen und Gesamtzahl 18 ergänzen. Fortschritt prüfen.
4. Neuen Stand mit Folge 8 beginnen. „Nächste Staffel“ bestätigen und Folge 3
   in Staffel 2 speichern. Elf gesehene Folgen und 61 Prozent prüfen.
5. Foto aus Galerie und Kamera hinzufügen, vergrößern, ersetzen und entfernen.
   Eingabe abbrechen und Entwurfs-/Verwerfendialog prüfen.
6. Stand bearbeiten, rückdatieren und löschen. Übersicht und Verlauf prüfen.
7. Erinnerung einschalten, Freigaben prüfen und Test-Erinnerung antippen.
   Zustellung bei Hintergrundbetrieb und nach Geräte-Neustart separat prüfen.
8. Serienprotokoll öffnen, drucken oder teilen. Verschlüsseltes Backup speichern
   und importieren. Fotos, Folgenstände und Erinnerungseinstellungen prüfen.
9. Große Systemschrift, Tastatur, Zurücknavigation und Querformat kurz prüfen.
10. In den Einstellungen „Datenschutzerklärung öffnen“ antippen. Die Seite
    `github.com/wasiliy-strecker/series-log/blob/main/PRIVACY.md` muss öffnen.

Die native Testsuite ersetzt keine reale Prüfung von Kamera, Dateiauswahl,
Hersteller-Energiesparregeln, Benachrichtigungszustellung oder PDF-Druckdiensten.
