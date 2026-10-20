# PDF-Auswahl vereinfacht

Die drei Smartphone-Screenshots von 20:35 und 20:36 zeigen lange, wiederholte
Erklärungen bei Einzel- und Serienprotokollen. Der Ablauf verwendet jetzt
„PDF erstellen“ und genau zwei kurze Aktionen: „PDF mit Foto erstellen“ und
„PDF ohne Foto erstellen“. Die Erklärabsätze vor und in der Auswahl entfallen.
Bei deaktivierter Foto-Aktion bleibt nur „Kein Foto vorhanden.“ sichtbar.
Die Ausgangskarten heißen „PDF zum Folgenstand“ beziehungsweise „PDF zur Serie“.

Gespeicherte Protokolle, neu erzeugte PDF-Kopfzeilen und neue Dateinamen
verwenden einheitlich „Mit Foto“ und „Ohne Foto“. Die Texte liegen weiterhin
zentral im deutschen Sprachkatalog. Die bestehenden Inhaltsmodi, Fotoauswahl
und gespeicherten Dokumente bleiben erhalten.

`npm run check` erfolgreich mit Prettier, ESLint, TypeScript und 82 Tests.
Der vorhandene Test für die Protokollerstellung verwendet die kürzere
Buttonbeschriftung. Die manuelle Prüfung der beiden Aktionen und der kurzen
Kennzeichnungen steht in `docs/VALIDATION.md`.

Die laufende, zuvor beauftragte Smartphone-Aktualisierung wurde mit
`npm run build:preview` fortgeführt, weil die eigenständige Dev-Installation
den App-Code eingebettet enthält. Build erfolgreich. Installation mit
`npm run install:preview -- A5CS024205005243` nach Prüfung von Kennung, Version,
Debug-Flag, Installer und identischer Signatur erfolgreich und datenbewahrend.
Paket `com.appfactory.series_log.dev`, Version 1.0.0, Code 1,
nicht debuggable, Installer null. Update um 20:42 und Prozessstart bestätigt.

Das Gerät hat sich während der Arbeit gesperrt. Das Entsperren wurde angefragt.
Die Sichtprüfung der neuen Auswahl am Gerät bleibt offen. Es wurden keine
Nutzerfotos verändert oder zusätzliche Protokolle erzeugt.

APK-SHA-256: `338cd9d913700b2037b0c337a6117da6e0fb7fa299ec60ee9f6a9bfaa984178b`.
Kein Store-Build und kein Push. Referenz-Apps bleiben unverändert.
