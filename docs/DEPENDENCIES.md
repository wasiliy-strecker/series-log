# Abhängigkeitsprüfung

Stand: 25. Oktober 2026. Die Aktualisierung folgt den kompatiblen SDK-57-Patches
aus MaschinenLogs Lockfile bei Commit `44078f4`. SerienLog besitzt weiterhin
eigene Abhängigkeiten, ein eigenes Lockfile und ein eigenes natives Projekt.
React bleibt bei 19.2.3 und React Native bei 0.86.3.

| Paket                  | Version |
| ---------------------- | ------- |
| expo                   | 57.0.31 |
| expo-asset             | 57.0.20 |
| expo-constants         | 57.0.22 |
| expo-crypto            | 57.0.4  |
| expo-dev-client        | 57.0.20 |
| expo-image-manipulator | 57.0.21 |
| expo-linking           | 57.0.13 |
| expo-router            | 57.0.29 |
| expo-sharing           | 57.0.24 |
| expo-splash-screen     | 57.0.10 |
| expo-sqlite            | 57.0.4  |

`npx expo install --check` bestätigt kompatible Abhängigkeiten. Expo Doctor
1.21.5 besteht 20 von 20 Prüfungen. Der bestehende Ausschluss von
`appConfigFieldsNotSyncedCheck` bleibt erhalten, weil Android versioniert ist
und Änderungen zusätzlich im app-eigenen Expo-Plugin gepflegt werden.

## Audit zum internationalen Release

Die App verwendet Zod 4.6.6. Damit ist der neue Hinweis zur Speicherbelegung bei
übergroßen eingeschränkten Sammlungen in der tatsächlich verwendeten
Laufzeitvalidierung behoben. Die Tests prüfen weiterhin die bestehenden
Backup-Fixtures und unveränderte Datenformate. Vitest wurde auf 5.0.5 aktualisiert.
Die beiden moderaten Paketeinträge zur Mock-Registrierung sind damit behoben.

`npm audit` und `npm audit --omit=dev` melden noch fünf hohe Paketeinträge,
keine kritischen oder moderaten Einträge. Beide Befehle enden deshalb mit Status 1.
Betroffen sind `node-forge` und die ältere Zod-3-Abhängigkeit der Expo-CLI sowie
deren übergeordnete Pakete. Das ist nicht die von der App importierte Zod-Version.
Ein von npm vorgeschlagener inkompatibler Expo-Downgrade wird nicht übernommen.

Der Release-Prüfer kontrolliert anhand der tatsächlichen Store-Source-Map, dass
Zertifikatswerkzeuge, `node-forge` und die verschachtelte CLI-Zod-Version
nicht im App-JavaScript enthalten sind. Aus dem Expo-CLI-Paket ist ausschließlich
der von Metro benötigte Laufzeitlader `build/metro-require/require.js` zugelassen.
Weitere CLI-Dateien werden abgewiesen. Er prüft weiterhin die bisherigen
Werkzeugpakete shell-quote, source-map-js, braces und vite. Der Audit ist keine
pauschale Sicherheitsfreigabe. Vollständige JSON-Berichte liegen im ausgelieferten
Verzeichnis `verification/`.

[Zod-Audit-Hinweis](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
[Vitest-Korrektur](https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8),
[node-forge-Hinweis](https://github.com/advisories/GHSA-86w9-cpqp-85rv).

## Native Android-Abhängigkeiten

Die app-eigene `plugins/dependency-versions.gradle` ersetzt gezielt zwei
transitive Android-Versionen. Das Expo-Plugin erhält diese Konfiguration bei
Prebuild. Diese nativen Festlegungen bestehen unabhängig vom JavaScript-Lockfile.

| Bibliothek | Bisher    | Jetzt  |
| ---------- | --------- | ------ |
| Gson       | 2.8.6     | 2.13.2 |
| Commons IO | 1.4 / 2.6 | 2.14.0 |

Gson enthält damit die Sicherheitskorrektur ab 2.8.9. Die gewählte Version
unterstützt Android ab API 21 und passt zur SerienLog-Mindestversion API 24.
[Gson-Korrektur](https://github.com/google/gson/pull/1991),
[Gson-Anforderungen](https://github.com/google/gson#requirements).

Commons IO 2.14.0 enthält die Korrektur für CVE-2024-47554 und benötigt Java 8.
Expo verwendet unter anderem Dateikopien, Verzeichniskopien, Löschen,
Stream-Kopien und Dateiendungen. Eine Nutzung des betroffenen XmlStreamReader
wurde in diesen Aufrufen nicht gefunden. Das Update beseitigt trotzdem die
betroffene alte Bibliotheksversion im aufgelösten Store-Abhängigkeitsbaum.
[Apache-Sicherheitshinweis](https://commons.apache.org/proper/commons-io/security.html).

`DependencyCompatibilityTest` prüft Gson-JSON-Roundtrips sowie die verwendeten
Commons-IO-Dateioperationen auf API 24, 25 und 35. Zusätzlich wird die Auflösung
im `storeReleaseRuntimeClasspath` per Gradle `dependencyInsight` geprüft.

Commons IO verwendet inzwischen `java.nio.file`. Für Android 7 verwendet die
App deshalb `desugar_jdk_libs_nio:2.1.5` statt der bisherigen Standardvariante.
Das Expo-Plugin erhält auch diesen Wechsel. Die JVM-Tests allein bilden fehlende
Java-Plattformklassen auf einem echten Android-7-Gerät nicht ab. Deshalb wird
zusätzlich im erzeugten Dev-DEX geprüft, dass die Dateiaufrufe auf die
mitgelieferten `j$.nio.file`-Klassen umgeschrieben wurden.
[Android-NIO-Desugaring](https://android-developers.googleblog.com/2023/02/api-desugaring-supporting-android-13-and-java-nio.html).

Für die native Sprachverwaltung verwendet das eigene Android-Modul zusätzlich
AndroidX AppCompat 1.7.0. Die Sprachtests prüfen API 24 und 35.
