# Android-Releases

Dev verwendet `com.appfactory.series_log.dev`, Store verwendet
`com.appfactory.series_log`. Beide besitzen getrennte Daten und Signaturen.
Store-Debug ist deaktiviert. Die erste Store-Auslieferung verwendet Version
1.0.0 (1). Vor dieser Auslieferung ist kein hochgeladener Versionscode bekannt.
Ein Store-Build oder Play-Upload benötigt einen eigenen Auftrag.

## Private Upload-Signatur

Der eigene RSA-4096-Upload-Schlüssel liegt außerhalb von Git unter
`~/.local/share/app-factory/signing/serienlog/`. Das Verzeichnis besitzt Modus
0700, seine Dateien 0600. Es enthält `upload-keystore.p12`, `key.properties`
und das öffentliche `upload-certificate.pem`.

Das gesamte Verzeichnis separat und sicher sichern. Schlüssel und Passwörter
nicht ins Repository, in Chatnachrichten oder in öffentliche Artefakte kopieren.
Den vorhandenen Schlüssel bei einem Rechnerwechsel wiederherstellen, nicht
neu erzeugen. Die private Konfiguration darf kein Dev-Keystore sein.

Nur bei der erstmaligen Einrichtung ohne vorhandene Identität:

```bash
python3 scripts/prepare-store-key.py
npm run prebuild
```

Das Skript verweigert das Überschreiben eines vorhandenen Signaturverzeichnisses.
Passwörter werden zufällig erzeugt und nicht ausgegeben. Expo verlinkt die
private Konfiguration als ignorierte `android/key.properties`. Prebuild erzeugt
selbst keinen Upload-Schlüssel. `plugins/key.properties.example` enthält nur
Platzhalter. Relative Keystore-Pfade beziehen sich auf `android/app`.

Signatur ohne Store-Artefakt prüfen, mit eingerichtetem JDK 21 und Android SDK:

```bash
cd android
./gradlew :app:verifyStoreSigning
```

Die Prüfung öffnet den tatsächlichen privaten Schlüssel und prüft Alias,
Passwort und Zertifikatsgültigkeit. Sie gibt nur den öffentlichen SHA-256-
Fingerabdruck aus. Store-Verpackungsaufgaben hängen von dieser Prüfung ab.
Ohne gültige Konfiguration gibt es keinen stillen Rückfall auf Debug-Signierung
oder unsignierte Auslieferung. Dev und reine Manifestprüfungen funktionieren
auch ohne privaten Store-Schlüssel.

Zum Prüfen des Fehlerfalls kann `-PserienlogStorePropertiesFile=/nicht/vorhanden`
an `verifyStoreSigning` übergeben werden. Das verändert keine privaten Dateien.

## Store-AAB bauen

Vor jedem weiteren Upload den tatsächlichen Console-Stand prüfen und den
`versionCode` in `app.config.ts` und `android/app/build.gradle` erhöhen.
Die Marketingversion nur bei Bedarf ändern. Bereits ausgelieferte Dateien
erhalten. Interne Tests und Produktion verwenden denselben Store-Flavor.

```bash
npm run check
npm run check:native -- -PreactNativeArchitectures=arm64-v8a --no-daemon
npm run check:permissions -- --no-daemon
npm run check:store
npx expo install --check
npm run build:store
```

Zusätzlich zu JDK 21 und Android SDK werden Python 3, OpenSSL und
`~/.local/share/app-factory/tools/bundletool-all-1.18.3.jar` benötigt.
Alternativ `BUNDLETOOL_JAR` setzen. Der Helfer nutzt die vorhandene native
Konfiguration und führt keinen Expo-Prebuild aus. Nach Änderungen an
Expo-Konfiguration oder Plugins zuerst `npm run prebuild` ausführen und die
erzeugten Dateien prüfen. Abhängigkeiten müssen zum Lockfile passen.

Der Helfer baut `:app:bundleStoreRelease` für ARM64 und x86_64 mit eingebettetem
Produktions-JavaScript. Er prüft anschließend mit Bundletool und Jarsigner die
tatsächliche AAB. Kennung, Name, Version, API 24 bis Target 36, eigenes
Upload-Zertifikat, ausgeschaltete Debug-/Testflags und Backup-Konfiguration
müssen stimmen. Netzwerk-, Mikrofon- und breite Medienberechtigungen sind
ausgeschlossen. Alle nativen Bibliotheken müssen passende 16-KB-Ladesegmente
besitzen und die Bundle-Konfiguration muss 16-KB-ZIP-Ausrichtung verlangen.
Die Source Map wird auf die dokumentierten Build-Werkzeug-Pakete geprüft.

Erst nach erfolgreicher Prüfung wird die benannte Datei angelegt:

```text
build/releases/production/serienlog-1.0.0-build-1-production.aab
```

Daneben liegt eine JSON-Prüfdatei mit Kennung, Version, Zertifikatsfingerabdruck,
SHA-256 und Prüfergebnissen. Vorhandene Auslieferungen werden nicht überschrieben.
Build-Dateien und privates Signaturmaterial bleiben außerhalb von Git.
Die bekannten npm-Audit-Meldungen sind in [Abhängigkeiten](DEPENDENCIES.md)
bewertet. Die Artefaktprüfung ersetzt keine allgemeine Sicherheitsbewertung.

Eine AAB-Erstellung benötigt kein Smartphone und installiert keine APK.
Die Dev-Installation bleibt erhalten. Play App Signing verwendet einen
separaten App-Signierschlüssel. Das hier vorbereitete Zertifikat ist der
Upload-Schlüssel. Es wird nicht zur Aktualisierung einer Play-Installation
per lokalem APK verwendet.

## Erste Auslieferung am 21. Oktober 2026

Version 1.0.0 (1) wurde mit dem vorhandenen eigenen Upload-Schlüssel gebaut
und mit Bundletool sowie Jarsigner erfolgreich geprüft. Paketkennung
`com.appfactory.series_log`, App-Name SerienLog, API 24 und Target 36 stimmen.
Netzwerk-, Mikrofon- und breite Medienberechtigungen fehlen. Alle 44 nativen
Bibliotheken bestehen die ELF-Ausrichtungsprüfung. Das Bundle fordert
`PAGE_ALIGNMENT_16K`. Das ist eine Artefaktprüfung, kein Lauf auf einem
Gerät mit 16-KB-Speicherseiten.

Prettier, ESLint, TypeScript, 82 Anwendungstests, 53 native Tests und neun
Release-Prüfertests erfolgreich. Eigenes Android-Lint mit 0 Fehlern und 30
Warnungen. Release-Lint ohne zusätzliche Task-Ausschlüsse erfolgreich.
Manifestprüfungen aller drei Varianten, Expo-Kompatibilität und alle 20
Doctor-Prüfungen bestanden. Die fünf geprüften Build-Werkzeug-Pakete fehlen
in den 2109 Quellen der Store-Source-Map.

SHA-256 der AAB:
`d1231d69ea7cdef1ccb3a896a2af489219c9d3071c94a0c9ed4b51fac7fd7465`.

Nachweise liegen ignoriert unter `build/validation/release-1/`.
Die deutschen Versionshinweise liegen neben der benannten AAB.
Ein erneuter Helferaufruf verweigert die vorhandene Auslieferung bereits vor
Gradle. Die Prüfsumme bleibt unverändert. Keine Geräteinstallation, kein
Play-Upload und keine Veröffentlichung durch diesen Build.

Öffentliche Datenschutzseiten:

- Deutsch: <https://wasiliy-strecker.github.io/series-log/datenschutz/>
- Englisch: <https://wasiliy-strecker.github.io/series-log/privacy/>

Quellen: [Android App Signing](https://developer.android.com/studio/publish/app-signing)
und [Android Backup-Konfiguration](https://developer.android.com/identity/data/autobackup).
