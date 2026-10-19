# Abhängigkeitsprüfung

Stand: 19. Oktober 2026. Die Aktualisierung folgt den kompatiblen SDK-57-Patches
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
