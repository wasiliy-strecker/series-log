# Internationaler Store-Release

SerienLog 1.0.0 (2) unterstützt sechs Sprachen. Der höchste lokal dokumentierte
Versionscode ist 1. Code 2 gehört zur nächsten Auslieferung.
Die Store-Paketkennung bleibt `com.appfactory.series_log`, Dev behält `.dev`.
Die vorhandene eigene Upload-Signatur wird weiterverwendet.

| Play-Sprache | App-Sprache | App- und Launcher-Name |
| ------------ | ----------- | ---------------------- |
| de-DE        | de          | SerienLog              |
| en-US        | en          | Series Log             |
| es-ES        | es          | Diario de series       |
| fr-FR        | fr          | Journal de séries      |
| it-IT        | it          | Diario delle serie     |
| pt-BR        | pt          | Diário de séries       |

## Sprache, Region und vorhandene Daten

Die Einstellungen bieten die Systemsprache und sechs dauerhaft gespeicherte
Sprachoptionen. Systemwahl verwendet die erste unterstützte Systemsprache,
ansonsten Englisch. Portugiesisch verwendet die brasilianische Übersetzung.
Ab Android 13 ist die Auswahl mit der Android-App-Sprachverwaltung verbunden.
Ältere Versionen speichern die Auswahl app-lokal. Dev-Namen behalten den Zusatz Dev.

Zahlen und Datumsangaben folgen unabhängig von der App-Sprache der Systemregion.
Die Eingabe positiver ganzer Zahlen akzeptiert gültige regionale Gruppierungen.
Dezimalwerte, Exponentialschreibweise und unsichere Ganzzahlen werden abgewiesen.
Staffel und Folge bleiben unabhängige Pflichtfelder. Die App ergänzt keine
Staffelverwaltung, Gesamtzahlen oder automatische Erkennung.

Ein Sprachwechsel setzt Services und Formulare nicht neu auf. Er aktualisiert
nur die Darstellung, den abgeleiteten Suchindex und Erinnerungstexte. Alarmtermine,
Benachrichtigungskanäle und eigene Inhalte bleiben erhalten. Gespeicherte Titel,
Genres und Notizen werden nicht übersetzt. Datenbank- und Backupformate bleiben
kompatibel, einschließlich früherer Folgenstände mit Episode null.
Die Sprachpräferenz ist eine Geräteeinstellung und kein neuer Bestandteil des
bestehenden Backupformats. Vorhandene PDF-Dateien behalten ihre Bytes.
Neue PDFs halten Sprache und Region für alle Seiten und Teildeckblätter fest.

## Quellen und Prüfablauf

`src/core/i18n/messages/` enthält sechs gleich aufgebaute Kataloge. Der native
Bridge liefert Sprachwahl und Geräteformatregion. `scripts/generate_localizations.py`
prüft Schlüssel und Platzhalter und erzeugt Android-Texte, App-Namen und
`locale_config.xml`. Das Expo-Plugin erhält diese Ressourcen beim Prebuild.

```bash
python3 scripts/generate_localizations.py
npm run check
npm run check:native -- -PreactNativeArchitectures=arm64-v8a --no-daemon
npm run check:permissions -- --no-daemon
npm run check:store
npx expo install --check
npx expo-doctor
npm audit
npm audit --omit=dev
npm run build:store
```

Die Tests prüfen Sprachreihenfolge, Fallback, unabhängige Regionen, regionale
Zahleneingabe, alte Backups, unveränderte Entwürfe und tatsächlich ausgelesenen
PDF-Text in allen sechs Sprachen. Ein Sprachwechsel während einer laufenden
PDF-Erstellung darf die Dokumentensprache nicht ändern. Native Sprachtests laufen
mit Robolectric auf API 24 und 35. Sie prüfen auch unveränderte Alarmtermine und
die Anzeigezeit bereits sichtbarer Benachrichtigungen.

## Store-Texte und Aufnahmen

`store/<Play-Sprache>/copy.json` enthält kopierbare Store-Texte, Bildüberschriften
und synthetische Beispieldaten. Namen, Kurzbeschreibung, vollständige Beschreibung
und Release-Notizen werden gegen ihre Feldgrenzen geprüft. Kopierdateien enthalten
keine vorangestellten Aufzählungszeichen. Die vorhandene deutsche Datenschutzseite
wird für Deutsch verwendet, die vorhandene englische Seite für die anderen Sprachen.
Es werden keine zusätzlichen übersetzten Rechtstexte behauptet.

Die Lieferung entsteht unter `releases/international/build-2/` außerhalb von Git.
Pro Sprache gibt es 16 Upload-Bilder: ein Icon, eine Feature-Grafik, sechs
Smartphone-Aufnahmen sowie jeweils vier Aufnahmen für 7- und 10-Zoll-Tablets.
Die Smartphone-Motive zeigen Übersicht, Seriendetails, Folgenstand, Verlauf,
Erinnerungen und ein in der App erstelltes PDF. Die Tabletgruppen zeigen Übersicht,
Verlauf, Erinnerungen und PDF. Alle Aufnahmen entstehen separat auf dem jeweiligen
Emulatorprofil. Überschriften stehen außerhalb des unveränderten App-Inhalts.

Die Demo-Backups entstehen über `SeriesService` und `BackupService` mit dem
öffentlichen Beispielpasswort `Demo2026`. Sie enthalten drei fiktive Serien,
neun Folgenstände und ein vorhandenes künstliches Serienfoto. Die sichtbaren
Wörter innerhalb dieses Beispielbildes gehören zum Bildinhalt, nicht zur App-UI.
Importiert wird über die normale Wiederherstellung und den Android-Dateidialog.
Es gibt weder einen versteckten Demo-Modus noch direkte Änderungen der App-Datenbank.

```bash
SL_FIXTURE_OUTPUT=releases/international/build-2/fixtures \
  npx vitest run --config scripts/store_assets/vitest.config.ts
bash scripts/store_assets/extract_apk.sh \
  build/releases/production/serienlog-1.0.0-build-2-production.aab \
  releases/international/build-2
python3 scripts/store_assets/run_capture.py de-DE phone \
  releases/international/build-2 \
  build/releases/production/serienlog-1.0.0-build-2-production.aab --port 5586
node scripts/store_assets/render.mjs assets releases/international/build-2/de-DE de-DE
node scripts/store_assets/render.mjs contact releases/international/build-2/de-DE de-DE
python3 scripts/store_assets/package.py releases/international/build-2 \
  --aab build/releases/production/serienlog-1.0.0-build-2-production.aab \
  --apk releases/international/build-2/raw/store.apk
```

Capture und Rendering werden für alle sechs Sprachen und drei Geräteprofile
wiederholt. Nur ausdrücklich angegebene Emulatoren mit eigenen `sl_store_assets`-
AVD-Namen werden akzeptiert. Physische Geräte und andere AVDs werden abgewiesen.
Die Upload-AAB bleibt unverändert. Bundletool signiert nur die abgeleitete
Emulator-APK lokal. Sie behält Store-Kennung, Release-Eigenschaften und die
bytegleichen DEX-, Asset- und Bibliotheksinhalte der AAB.

## Lieferung

Jedes Sprach-ZIP enthält Upload-Bilder, Textfelder, Alt-Texte, Kontaktübersicht,
Upload-Hinweise und ein Herkunftsmanifest mit APK-, AAB- und Bildprüfsummen.
Das Gesamt-ZIP enthält zusätzlich die signierte AAB, alle Sprach-ZIPs,
Release-Titel, Release-Notizen mit Play-Sprachtags und Prüfberichte.
Eine separate SHA-256-Datei bestätigt das Gesamt-ZIP.

Der Paketierer prüft alle 96 Upload-Bilder und die Herkunft der 84 Rohaufnahmen.
Er kontrolliert Anzahl, Pixelmaße, Farbmodus, vollständige PNG-Dekodierung,
Dateigrößen und Textgrenzen. Bereits benannte Lieferarchive werden nicht ersetzt.
Kontaktübersichten, Rohaufnahmen und Demo-Backups sind keine Play-Uploads.
Das Video-Feld bleibt leer. Persönliche Geräte und Daten werden nicht verwendet.
Upload, Push und Veröffentlichung sind nicht Bestandteil dieser Auslieferung.

## Prüfergebnisse für 1.0.0 (2)

Prettier, ESLint, TypeScript und 89 App-Tests sind erfolgreich. Die sieben
Lokalisierungstests decken unter anderem Zahlen und Uhrzeiten nach Geräteformat,
alte Backups, unveränderte Entwürfe und tatsächlich ausgelesene PDF-Texte ab.
Der PDF-Test prüft alle sechs Sprachen und ungetrennte Tabellenüberschriften.
Die statische Sprachprüfung kontrolliert 518 Schlüssel pro Sprache, Platzhalter,
565 Übersetzungsaufrufe sowie nicht übersetzte JSX-Texte und UI-Attribute.

59 native Tests, Android-Lint, neun Release-Prüfertests, vier Store-Werkzeugtests
und die Erstellung der sechs synthetischen Backups sind erfolgreich.
Die Manifestprüfungen aller drei Varianten und alle 20 Expo-Doctor-Prüfungen
sind bestanden. Die konkreten Abhängigkeitsstände und die fünf verbleibenden
hohen Audit-Einträge stehen in [DEPENDENCIES.md](DEPENDENCIES.md).

Die signierte AAB besteht die Identitäts-, Signatur-, Berechtigungs-, Source-Map-
und 16-KB-Artefaktprüfungen. Die daraus erzeugte Emulator-APK enthält 52 bytegleich
geprüfte DEX-, Asset- und Bibliotheksdateien. Alle 44 nativen Bibliotheken haben
die erforderliche ELF-Ausrichtung. Ein Hardwaretest mit 16-KB-Speicherseiten
ist damit nicht behauptet. Die frühere AAB für Code 1 bleibt unverändert.

Die 84 Rohaufnahmen aus 18 isolierten Sprach-/Geräteprofilen, alle 96 fertigen
Upload-Bilder und die sechs Sprachwahl-Ansichten wurden visuell geprüft.
Die Prüfung umfasst übersetzte App-Namen, Textumbrüche, Formularbeschriftungen,
PDF-Tabellen und die Bildüberschriften. Ein Sprachwechsel zu Englisch bleibt nach
einem Kaltstart erhalten, während die deutsche Geräteregion das Datumsformat
beibehält. Die Rückkehr zur Systemsprache wurde ebenfalls am Release geprüft.
`verification/visual-review.json` und `verification/language-selection.json`
enthalten die Ergebnisse. Die finalen Aufnahmen verwenden ausschließlich die
abgeleitete APK der ausgelieferten AAB.

[Android-App-Sprachen](https://developer.android.com/guide/topics/resources/app-languages),
[Google-Play-Grafiken](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).
