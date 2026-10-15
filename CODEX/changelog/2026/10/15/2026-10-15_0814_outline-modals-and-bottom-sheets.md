# Dezente Rahmen für Dialoge und untere Panels

Die letzten beiden SerienLog-Screenshots vom angeschlossenen Smartphone geprüft.
Sie zeigen die untere PDF-Auswahl und die mittige Löschabfrage ohne äußere Kontur.
Die entsprechenden Oberflächen in MaschinenLog als Referenz gelesen. Ausgangsstand
`d818f4d` war vollständig committet und mit GitHub synchronisiert.

Ein zentraler Theme-Farbwert `overlayBorder` in gedecktem Rot (`#63343A`) umrandet
die eigenen Oberflächen über dem Backdrop mit einem dünnen Rahmen von 1 dp.
Er gilt für gemeinsame Bestätigungen, Auswahldialoge, Menüs und untere Panels sowie
Datum-/Uhrzeitauswahl, Backup-Passwortabfragen, Ladeanzeige und Beispielfoto-Galerie.
Die vorhandenen Rundungen und Schließgesten bleiben erhalten. Manuelle Prüfschritte
in `docs/VALIDATION.md` ergänzt. Nachbar-Apps unverändert.

`npm run check` mit Prettier, ESLint, TypeScript und allen 20 bestehenden Tests
erfolgreich. Die reine Gestaltung benötigt keine zusätzlichen Verhaltenstests
oder aufwendige visuelle Testreihe.

Da die installierte eigenständige Testversion ihr JavaScript eingebettet enthält,
die Dev-APK inkrementell mit `:app:assembleDevRelease` aus dem bestehenden nativen
Projekt erstellt. Build in 37 Sekunden erfolgreich. `install:preview` prüfte
`com.appfactory.series_log.dev`, Version `1.0.0`, Versionscode `1`, fehlendes
Debug-Flag, Installer `null` und die übereinstimmenden Signaturzertifikate.
Datenbewahrend installiert und gestartet.

Am Smartphone die PDF-Auswahl und die Löschabfrage eines bestehenden Protokolls
geöffnet und die neue Kontur auf beiden Oberflächen visuell bestätigt. Das untere
Panel per Ziehen geschlossen. Den Löschdialog mit „Abbrechen“ geschlossen.
Keine PDF angelegt oder gelöscht. Die übrigen Oberflächen im Code geprüft.

Changelog in den gleichnamigen Workspace-Pfad kopiert. Formatierung und
Git-Whitespace-Prüfung erfolgreich. Lokaler Commit nach Abschluss. Keine
Versionsanhebung, kein Store-Build und kein Push.
