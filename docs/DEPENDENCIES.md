# Abhängigkeitsprüfung

Stand: 20. Oktober 2026. Die Aktualisierung folgt den kompatiblen SDK-57-Patches
aus MaschinenLogs Lockfile bei Commit `44078f4`. SerienLog besitzt weiterhin
eigene Abhängigkeiten, ein eigenes Lockfile und ein eigenes natives Projekt.
React bleibt bei 19.2.3 und React Native bei 0.86.3.

| Paket                  | Version |
| ---------------------- | ------- |
| expo                   | 57.0.30 |
| expo-asset             | 57.0.20 |
| expo-constants         | 57.0.22 |
| expo-crypto            | 57.0.4  |
| expo-dev-client        | 57.0.20 |
| expo-image-manipulator | 57.0.21 |
| expo-linking           | 57.0.13 |
| expo-router            | 57.0.28 |
| expo-sharing           | 57.0.23 |
| expo-splash-screen     | 57.0.10 |
| expo-sqlite            | 57.0.4  |

`npx expo install --check` bestätigt kompatible Abhängigkeiten. Expo Doctor
1.21.5 besteht 20 von 20 Prüfungen. Der bestehende Ausschluss von
`appConfigFieldsNotSyncedCheck` bleibt erhalten, weil Android versioniert ist
und Änderungen zusätzlich im app-eigenen Expo-Plugin gepflegt werden.

## Audit

Vorher meldete `npm audit` einen kritischen und 20 hohe Paketeinträge. Nach der
Aktualisierung melden sowohl `npm audit` als auch `npm audit --omit=dev` keine
kritischen und 18 hohe Einträge. Beide Befehle enden deshalb weiterhin mit
Exitcode 1. Die Anzahl enthält betroffene übergeordnete Pakete, keine 18
unabhängigen Ursachen.

- `shell-quote` wurde von 1.10.0 auf 1.12.0 aktualisiert. Damit entfällt
  [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv).
- `source-map-js` wurde von 1.2.1 auf 1.2.2 aktualisiert. Damit entfällt
  [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
- Offen bleibt `node-forge` 1.4.0 in der Expo-CLI und deren Zertifikatswerkzeugen.
  Die Meldung betrifft RSA-Signaturprüfung mit präparierten Eingaben.
  [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
- Offen bleibt `braces` 3.0.3 in den Musterverarbeitungs-Abhängigkeiten der
  Entwicklungswerkzeuge. Die Meldung betrifft tief verschachtelte Muster.
  [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Npm schlägt für die verbleibenden Ursachen einen inkompatiblen Wechsel auf
Expo 44 vor. Dieser wird nicht angewendet. Es gibt keine neuen Overrides,
keine Audit-Unterdrückung und keinen erzwungenen Downgrade. Die vorhandenen
Overrides für uuid und decode-uri-component bleiben erhalten.

`--omit=dev` ist keine Analyse des Android-Bundles. Expo enthält auch Werkzeuge
innerhalb normaler Abhängigkeitsketten. Aus dieser Einordnung folgt keine
pauschale Aussage über Unbedenklichkeit oder eine Store-Freigabe.

## Native Android-Abhängigkeiten

Die app-eigene `plugins/dependency-versions.gradle` ersetzt gezielt zwei
transitive Android-Versionen. Das Expo-Plugin erhält diese Konfiguration bei
Prebuild. Die JavaScript-Abhängigkeiten und das Lockfile bleiben unverändert.

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
