# SerienLog

Eigenständige Android-App mit React Native, TypeScript, Expo und SQLite.
Die Workspace-Regeln gelten mit der ausdrücklich beauftragten React-Ausnahme.
Hausakte und LeseLog sind Referenzen. Keine Dateien dort ändern und keine
Runtime-Abhängigkeiten zu Nachbar-Apps einführen.

## Architektur und Fachlogik

Schlanke Expo-Router-Routen in `src/app`, View-Model-Hooks in den Features.
Geschäftsregeln in Services und `src/core/domain/progress.ts`.
Gerätezugriffe über Ports, persistente Formularentwürfe und SQLite-Transaktionen.
Erst Datenbankänderungen abschließen, dann nicht mehr referenzierte Dateien löschen.
Staffelabschluss und Folgenstand atomar speichern.

Die Folgenlogik ist in README.md dokumentiert und vom Nutzer bestätigt.
Keine erfundenen Gesamtzahlen oder Prozentwerte. Ganze Staffel-/Folgenzahlen.
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

Android-Änderungen auch im Plugin `plugins/with-series-android.js` pflegen.
Dev nutzt `com.appfactory.series_log.dev` und das Label `SerienLog Dev`.
Store nutzt `com.appfactory.series_log`. Store-Debug ist deaktiviert.
Store-Release ist bis zur eigenen privaten Upload-Signatur unsigniert vorbereitet.
Keine fremden Signaturen kopieren. Lokaler Dev-Schlüssel liegt unter `.local/`.
Keine Store-Builds, Veröffentlichung oder Push ohne ausdrücklichen Auftrag.

Pro Task einen Changelog unter `CODEX/changelog/YYYY/MM/DD/` schreiben und in
den gleichnamigen Workspace-Pfad kopieren, da der Workspace kein Git-Repo ist.
Nach erfolgreicher Prüfung dieses App-Repository lokal committen.
