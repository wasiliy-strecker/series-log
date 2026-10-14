# Optionale Staffelfolgenzahlen verständlich beschriften

Der missverständliche Button „Staffel ergänzen“ heißt jetzt dynamisch „Folgenzahl für Staffel 1 eintragen“, danach entsprechend für die nächste Staffel. Auch das Entfernen nennt die konkrete Staffel-Angabe. Der Abschnitt heißt „Folgenzahlen (optional)“ und erklärt die Gesamtzahl, leere Felder und die Berechnung anhand von acht Folgen in Staffel 1 plus drei Folgen in Staffel 2.

`npm run check` mit Formatierung, ESLint, TypeScript und 24 Tests erfolgreich. Für diese reine Textänderung keine neuen automatisierten UI-Tests hinzugefügt. Der kurze manuelle Prüfschritt steht als Schritt 16 in `docs/VALIDATION.md`.

Kein Android-Gerät verbunden. Daher kein APK-Build und keine Geräteaktualisierung für diese Textänderung ausgeführt. Die eigenständige Smartphone-Vorschau benötigt bei der nächsten Aktualisierung `npm run build:preview` und anschließend `npm run install:preview -- A5CS024205005243`. Kein Store-Build und kein Push.
