# Serienangaben an den einfachen LeseLog-Ablauf anpassen

Die separate Liste für Staffelfolgenzahlen und die Aktionen zum Hinzufügen und Entfernen von Staffelangaben aus den Serienangaben entfernt. Sichtbar bleiben Titel, Genre und die optionale Gesamtfolgenzahl sowie Notiz und Erinnerung. Das View-Model verwaltet keine zusätzlichen Staffelfeld-Entwürfe mehr.

Staffel und zuletzt gesehene Folge werden weiterhin im Folgenstand erfasst. Bestätigte Staffelabschlüsse über „Nächste Staffel“ merken die Staffellänge. Die bisher gespeicherten Staffellängen bleiben in Datenbank und Backups erhalten und werden beim Bearbeiten der Serie übernommen. Eine unbekannte Gesamtberechnung fordert nicht mehr dazu auf, die entfernten Staffelfelder zu ergänzen. Der direkte Einstieg zur Serienbearbeitung heißt jetzt „Gesamtfolgenzahl ändern“.

`npm run check` mit Formatierung, ESLint, TypeScript und 25 Tests erfolgreich. Der neue gezielte Test prüft, dass Titel- und Gesamtzahländerungen sowie eine offene Gesamtzahl bestehende Staffellängen bewahren. Fehlermeldungen werden nur noch vorhandenen Formularfeldern zugeordnet. Kurze manuelle Prüfung als Schritt 16 in `docs/VALIDATION.md` dokumentiert.

Kein Android-Gerät verbunden. Kein APK-Build oder Geräteupdate für diese Änderung ausgeführt. Für die nächste Aktualisierung der eigenständigen Vorschau im App-Verzeichnis `npm run build:preview` und anschließend `npm run install:preview -- A5CS024205005243` ausführen. Kein Store-Build und kein Push.
