# SerienLog

Eigenständige Android-App mit React Native, TypeScript, Expo und SQLite.
Die Workspace-Regeln gelten mit der ausdrücklich beauftragten React-Ausnahme.
Hausakte und LeseLog sind Referenzen. Keine Dateien dort ändern und keine
Runtime-Abhängigkeiten zu Nachbar-Apps einführen.

## Architektur und Fachlogik

Schlanke Expo-Router-Routen in `src/app`, View-Model-Hooks in den Features.
Geschäftsregeln in Services und `src/core/domain/episode-position.ts`.
Gerätezugriffe über Ports, persistente Formularentwürfe und SQLite-Transaktionen.
Erst Datenbankänderungen abschließen, dann nicht mehr referenzierte Dateien löschen.
Folgenstand und Entfernen seines Entwurfs atomar speichern.

Der einfache Folgenstand ist in README.md dokumentiert und vom Nutzer beauftragt.
Staffel und Folge sind unabhängige Pflichtfelder mit positiven ganzen Zahlen.
Keine Gesamtzahlen, Staffelverwaltung, Fortschrittsberechnung oder Bestätigungen
für Staffelwechsel und Rücksprünge. Ältere Datensätze und Backups erhalten.
Dunkles Design mit roten Akzenten, heller Schrift und eigenem SerienLog-Symbol.

## Entwicklung und Prüfung

`npm ci`, `npm run check`. Die bestehende Testsuite ist klein und fachlich gezielt.
Keine aufwendigen visuellen Testreihen. Manuelle Geräteprüfschritte stehen in
`docs/VALIDATION.md`. Native Änderungen mit `npm run check:native` prüfen.

`npm start` nutzt Metro-Port 8085. `npm run build:dev` erzeugt bei einem echten
nativen Installationsbedarf die Dev-APK. `npm run install:dev -- DEVICE` prüft
Kennung und Signatur und installiert datenbewahrend. Normale TS-/UI-Änderungen
per Fast Refresh. Für eine ausdrücklich gewünschte eigenständige Testinstallation
stehen `build:preview` und `install:preview` zur Verfügung.
Store und Dev-Preview dürfen weder INTERNET noch ACCESS_NETWORK_STATE anfordern.
Dev-Debug behält Metro-Zugriff. Nach Änderungen an Android-Konfiguration oder
Abhängigkeiten zusätzlich `npm run check:permissions` ausführen. Dieser Befehl
prüft nur die Manifest-Merges und erstellt keine Store-APK oder AAB.

Android-Änderungen auch im Plugin `plugins/with-series-android.js` pflegen.
Dev nutzt `com.appfactory.series_log.dev` und das Label `SerienLog Dev`.
Store nutzt `com.appfactory.series_log`. Store-Debug ist deaktiviert.
Store-Release benötigt die eigene private Upload-Signatur. Einrichtung und
Prüfung stehen in `docs/ANDROID_RELEASES.md`. Keine unsignierten Store-Artefakte.
Keine fremden Signaturen kopieren. Lokaler Dev-Schlüssel liegt unter `.local/`.
Keine Store-Builds, Veröffentlichung oder Push ohne ausdrücklichen Auftrag.

Pro Task einen Changelog unter `CODEX/changelog/YYYY/MM/DD/` schreiben und in
den gleichnamigen Workspace-Pfad kopieren, da der Workspace kein Git-Repo ist.
Nach erfolgreicher Prüfung dieses App-Repository lokal committen.
