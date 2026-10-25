# SerienLog für sechs Store-Sprachen vorbereitet

App, Fehlermeldungen, PDF-Ausgaben, native Dialoge und Erinnerungen sind in
Deutsch, Englisch, Spanisch, Französisch, Italienisch und brasilianischem
Portugiesisch verfügbar. Auch die sichtbaren App-Namen sind übersetzt.
Die gespeicherte Sprachwahl verwendet einen System-Fallback. Zahlen und Zeiten
folgen unabhängig davon der Geräteregion. Bestehende Daten, Entwürfe und Backups
bleiben kompatibel.

Der Store-Release 1.0.0 mit Versionscode 2 wurde privat signiert und geprüft.
Die Lieferung unter `releases/international/build-2/` enthält sechs Sprach-ZIPs
mit je 16 Upload-Bildern sowie ein Gesamtpaket mit AAB, Vorschauen, Store-Texten,
Release-Notizen, Prüfsummen und Herkunftsnachweisen. Alle Screenshots wurden mit
synthetischen Backups auf isolierten Emulatoren aus der finalen AAB aufgenommen.
84 Rohaufnahmen, 96 Upload-Bilder und sechs Einstellungsansichten wurden visuell
geprüft. Es gab keinen Push, Upload oder Zugriff auf persönliche Geräte und Daten.

Prettier, ESLint, TypeScript, 89 App-Tests, 59 native Tests, Android-Lint,
neun Release-Prüfertests, vier Store-Werkzeugtests, die Manifestprüfungen und
20 Expo-Doctor-Prüfungen sind erfolgreich. Sechs Sprachkataloge mit je 518
Schlüsseln und 565 Übersetzungsaufrufe wurden statisch geprüft. Die Store-Prüfung
bestätigt 52 bytegleiche Dateien zwischen AAB und Aufnahme-APK sowie die
16-KB-ELF-Ausrichtung aller 44 nativen Bibliotheken. Ein Hardwaretest mit
16-KB-Speicherseiten wurde nicht durchgeführt.

Fünf hohe npm-Audit-Paketeinträge verbleiben in der Expo-CLI-Werkzeugkette.
Der betroffene Code ist gemäß Store-Source-Map nicht im App-Bundle enthalten.
Details und Audit-Protokolle sind dokumentiert. Die frühere AAB für Code 1
bleibt unverändert.

AAB SHA-256:
`dfe279b70d67cb35b7233714393e2bec450ad96e1b9eb03f23b700650dcc322f`
