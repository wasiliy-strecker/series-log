# Android-Releases

Dev verwendet `com.appfactory.series_log.dev`, Store verwendet
`com.appfactory.series_log`. Beide besitzen getrennte Daten und Signaturen.
Store-Debug ist deaktiviert. Version 1.0.0 (1) bleibt bei dieser Vorbereitung
unverändert. Ein Store-Build oder Play-Upload benötigt einen eigenen Auftrag.

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

## Vor einem später beauftragten Play-Test

Aktuellen Upload-Stand prüfen und einen noch nicht verwendeten `versionCode`
wählen. `npm run check`, `npm run check:native` und
`npm run check:permissions` ausführen. Erst danach das signierte Store-AAB
erzeugen, Paketkennung und Version prüfen und als versionierte Datei ablegen.
Die Dev-Installation bleibt dabei erhalten. Play App Signing verwendet einen
separaten App-Signierschlüssel. Das hier vorbereitete Zertifikat ist der
Upload-Schlüssel. Es wird nicht zur Aktualisierung einer Play-Installation
per lokalem APK verwendet.

Öffentliche Datenschutzseiten:

- Deutsch: <https://wasiliy-strecker.github.io/series-log/datenschutz/>
- Englisch: <https://wasiliy-strecker.github.io/series-log/privacy/>

Quellen: [Android App Signing](https://developer.android.com/studio/publish/app-signing)
und [Android Backup-Konfiguration](https://developer.android.com/identity/data/autobackup).
