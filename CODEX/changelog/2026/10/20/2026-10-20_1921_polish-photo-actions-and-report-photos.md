# Fotomenü überarbeitet und Protokollfoto vergrößert

Die Smartphone-Screenshots von 19:11 und 19:13 zeigen das kleine kantige
Fotomenü und das verkleinerte Foto im Serienprotokoll. Das Fotomenü öffnet jetzt
das vorhandene abgerundete Auswahlpanel mit dezenter Außenkontur. Ersetzen und
Entfernen erhalten Symbole, Hilfetexte und große Aktionsflächen. Entfernen ist
rot hervorgehoben und hat keinen Navigationspfeil. Die Kamera-/Galerie-Auswahl
verwendet denselben Stil. Sortierung, Abbruch und Fotoverwaltung bleiben erhalten.
Die Aktionstexte liegen zentral unter stabilen Schlüsseln im deutschen Sprachkatalog.

Neue Protokolle verwenden die Fotodarstellung aus MaschinenLog mit einer eigenen
Fotoseite und maximal 70 Prozent der verfügbaren Breite und Höhe. Das Bild bleibt
proportional, horizontal zentriert und vollständig sichtbar. Der Rahmen liegt
direkt am Bild. Eintrag, Folgenstand und Dateiname stehen darüber. Nachfolgende
Verlaufseinträge beginnen auf einer neuen Seite. Die bestehende Auswahl des
ersten aktuellen Fotos und die Originalbilddaten bleiben erhalten. Bereits
gespeicherte PDFs werden nicht verändert.

`npm run check` erfolgreich mit Prettier, ESLint, TypeScript und 80 Tests.
Zwei ergänzte PDF-Fälle prüfen die tatsächlichen Zeichenaufrufe im Einzel- und
Verlaufsprotokoll, vergrößerte Maße, Zentrierung, Seitenverhältnis, Seitenfolge
und unveränderte Bilddaten. Manuelle Schritte für Fotomenü und Protokolldarstellung
stehen in `docs/VALIDATION.md`. Keine aufwendige visuelle Testreihe.

Die zuvor beauftragte eigenständige Geräteinstallation wurde mit
`npm run build:preview` aktualisiert. Ihr eingebetteter App-Code erfordert eine
neue Preview-APK. Build erfolgreich. `npm run install:preview -- A5CS024205005243`
hat Paket, Version, Debug-Flag, Installer und Signatur geprüft und die APK
datenbewahrend installiert. Ziel ist ausschließlich `com.appfactory.series_log.dev`,
Version 1.0.0, Code 1, nicht debuggable, Installer null. Die Signaturen stimmen
überein. Die Installation um 19:21 und der Prozessstart sind bestätigt.
Kein JavaScript- oder Android-Absturz im kurzen Prozesslog.

Die neue Sichtprüfung am Gerät bleibt offen, weil das Smartphone gesperrt ist.
Das Entsperren wurde angefragt. Es wurden keine Nutzerfotos ersetzt oder entfernt
und kein zusätzliches Protokoll auf dem Gerät erstellt.

APK-SHA-256: `71bc6a952e9f125c23f95beee422d043987f0da022fdbbb1d9e485ba3c21f921`.
MaschinenLog und ModellbauLog bleiben unverändert. Kein Store-Build und kein Push.
