# Prüfung der ersten SerienLog-Version

## Ausgeführt

`npm run check`: Formatierung, ESLint, TypeScript und 25 gezielte Tests für
Folgenberechnung, optionale Gesamtzahlen, Staffelwechsel, Rücksprünge,
SQLite-Persistenz, Suche, Paginierung, Korrekturen, Dateireferenzen, PDF-Erzeugung
und verschlüsselte Backups sowie Erinnerungsdefaults, Zeitumstellung und
Statusfälle. Die Backup-Prüfung nutzt echte JPEG-/PDF-Dateien und verifiziert
die Verschlüsselung zusätzlich mit Node/OpenSSL.

`npm run check:native`: 44 JVM-Tests für
Erinnerungen, Zeitzonen, Android-Berechtigungen, Dateizugriff und
Passwortableitung bestanden. Android-Lint für das eigene Modul bestanden.
Die bereits in der Vorlage dokumentierten Lint-Abstürze zweier Expo-/Worklets-
Abhängigkeiten werden im übernommenen Skript gezielt ausgeschlossen.

`expo prebuild`: Eigene Android-Kennungen, Expo-Modul, Icon, Startfarben und
getrennte Dev-/Store-Varianten erzeugt. Kein Store-Debug und kein Store-Build.

`npm run build:preview`: Eigenständige Dev-Testversion mit eingebettetem
JavaScript und aktualisierter nativer Erinnerungslogik erfolgreich gebaut.

`npx expo export --platform android --output-dir build/bundle-check`: Android-
JavaScript-Bündel mit Metro und Hermes erfolgreich erzeugt. Das ist kein APK-
oder Store-Build.

## Kurze manuelle Abnahme auf einem Gerät

Die vollständige manuelle Abnahme steht noch aus. Schritt 10 sowie Öffnen,
Weiterblättern, Randpfeile und Android-Zurück der Beispielgalerie aus Schritt 13
wurden auf einem verbundenen Android-Smartphone geprüft. Es wurde keine
umfangreiche visuelle Testreihe gestartet.

1. Serie mit Titel und Genre anlegen. Gesamtfolgenzahl offen lassen.
2. Staffel 1, Folge 3 ohne Foto speichern. Drei Folgen ohne Prozentwert prüfen.
3. Gesamtfolgenzahl 18 in den Serienangaben einstellen. Fortschritt prüfen.
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
11. Eine Erinnerung aktivieren, Intervall und Tag ändern, aus- und wieder
    einschalten. Die Auswahl muss erhalten bleiben. „Erinnerung jetzt testen“
    soll Serientitel und letzten Folgenstand zeigen und zur Serie führen.
    Blockierte App oder Kategorie, „Nicht stören“ und fehlende Alarmfreigabe
    sollen unterschiedliche Hinweise und passende Einstellungsziele zeigen.
12. Bei aktiver normaler Erinnerung auf Android 12 oder neuer „Alarme &
    Erinnerungen“ öffnen antippen. Die Android-Einstellung für SerienLog muss
    erscheinen. Danach zu SerienLog zurückkehren und prüfen, dass die gewählte
    Erinnerungsart erhalten blieb.
13. Einen neuen Folgenstand beginnen. Die Foto-Hinweise zur Aufnahme und lokalen
    Speicherung lesen und „Beispiele ansehen“ öffnen. Vier Beispiele durch
    Wischen und mit den Pfeilen ansehen. Am Anfang und Ende muss der jeweilige
    Pfeil deaktiviert sein. Galerie mit Schließen, Android-Zurück und nach unten
    Ziehen schließen. Die Beispiele dürfen keine Fotos oder Folgenstände
    übernehmen. Große Schrift und Querformat müssen durch Scrollen nutzbar bleiben.
14. Eine Serie mit insgesamt 26 Folgen öffnen und Folge 59 eintragen. Speichern
    muss den Konflikt mit beiden Zahlen direkt am Folgenfeld erklären. Über
    „Gesamtfolgenzahl ändern“ zu den Serienangaben wechseln. Ohne Änderungen
    zurückkehren und die erhaltene Eingabe prüfen. Dann die Gesamtzahl bewusst
    erhöhen oder leer lassen, speichern und zum angefangenen Folgenstand
    zurückkehren. Die neue Grenze muss sofort gelten. Eine unbekannte Gesamtzahl
    darf keinen Prozentwert erzeugen.
15. Einen Folgenstand mit Bild speichern. Das Bild muss im Dashboard und oben
    in der Serie erscheinen. Im Dashboard öffnet Antippen die Serie. In den
    Details öffnet Antippen das Original mit Zoom. Neuere Stände ohne Bild
    dürfen die Vorschau nicht entfernen. Ein Bild ändern oder den zugehörigen
    Stand löschen und die aktualisierte Vorschau beziehungsweise den Rückgriff
    auf das ältere Bild prüfen. Serien ohne Bild bleiben ohne leere Bildfläche.
16. Serie anlegen und bearbeiten. Es darf keine separate Liste für Staffeln und
    keine Aktion zum Hinzufügen einer Staffel geben. Die optionale Gesamtzahl
    muss leer bleiben können. Bei einer älteren Serie mit gespeicherten
    Staffellängen nur Titel oder Genre bearbeiten. Der bisherige Fortschritt
    muss nach dem Speichern erhalten bleiben.

Die native Testsuite ersetzt keine reale Prüfung von Kamera, Dateiauswahl,
Hersteller-Energiesparregeln, Benachrichtigungszustellung oder PDF-Druckdiensten.
