# Serienbilder im Dashboard und in den Details anzeigen

Die Serienkarten zeigen jetzt das jüngste gespeicherte Serienbild als breite Vorschau. In den Seriendetails erscheint das Bild größer vor den Serienangaben. Antippen öffnet dort die vorhandene Vollbildansicht mit Zoom. Ohne Bild entfällt die Bildfläche. Fehlende Bilddateien erhalten eine verständliche Ersatzanzeige.

Dashboard und Details verwenden dieselbe SQLite-Abfrage. Gewählt wird das erste Foto des zeitlich neuesten gespeicherten Folgenstands mit Foto. Neuere Stände ohne Bild verdrängen diese Vorschau nicht. Ältere Einträge außerhalb der ersten Verlaufsseite werden berücksichtigt. Entwurfsbilder und PDF-Anhänge werden nicht als Serienbild verwendet. Änderungen und Löschungen aktualisieren die Vorschau mit Rückgriff auf ältere Bilder.

`npm run check` mit Formatierung, ESLint, TypeScript und 24 Tests erfolgreich. Der neue gezielte SQLite-Test prüft identische Auswahl in beiden Ansichten, mehrere Fotos, PDF-Anhänge, mehr als zehn neuere Stände ohne Bild, bearbeitete ältere Einträge, Entwürfe, Bildreihenfolge, Löschungen und die Trennung verschiedener Serien.

`npm run build:preview` erfolgreich. Nach Prüfung von Paket, Version, Debug-Flag, Installer und übereinstimmender Signatur datenbewahrend auf dem verbundenen HONOR BVL-N49 installiert. Paket `com.appfactory.series_log.dev`, Version 1.0.0, Code 1, nicht debuggable, Installer `null`. Die App wurde gestartet. Kein Android- oder JavaScript-Absturz im kurzen Logcheck. Das Smartphone war für die anschließende Sichtprüfung gesperrt. Der kurze Prüfschritt steht als Schritt 15 in `docs/VALIDATION.md`.

Keine zusätzliche visuelle Testreihe, kein Store-Build und kein Push.
