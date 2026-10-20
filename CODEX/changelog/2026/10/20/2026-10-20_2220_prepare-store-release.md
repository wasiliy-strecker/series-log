# Prepare SerienLog for Store release

## Änderungen

- Eigene private RSA-4096-Upload-Signatur außerhalb von Git eingerichtet.
  Store-Verpackungsaufgaben verlangen einen gültigen Schlüssel. Dev-Zertifikat
  und unsignierter Rückfall sind ausgeschlossen. Einrichtung dokumentiert.
- Deutsche und englische Datenschutzseiten nach MaschinenLog vorbereitet.
  Gemeinsame Kontakt-, Support- und Rechteabschnitte übernommen. SerienLog-
  Daten, Fotos, Löschung, Erinnerungen und Backups zutreffend beschrieben.
  App und README verlinken die GitHub-Pages-Seiten.
- Automatische Cloud-Backups und Geräteübertragung für alle neun Android-
  Speicherbereiche explizit ausgeschlossen. Expo erhält die Regeln.
- Gson auf 2.13.2 und Commons IO auf 2.14.0 angehoben. Android 7 erhält
  NIO-Desugaring 2.1.5. Keine Änderung der Expo-/npm-Versionen.
- Der Nutzer hat die Veröffentlichung des gesamten lokalen Stands inklusive
  der 13 vorherigen Commits und die Einrichtung von Pages aus main/docs bestätigt.

## Prüfung

- npm run check erfolgreich. Formatierung, ESLint, TypeScript und 82 Tests.
- Native Prüfung mit arm64-v8a erfolgreich. 53 Tests einschließlich neun
  Dateiverarbeitungs-/Gson-Prüfungen auf API 24, 25 und 35. Keine Lint-Fehler.
- Alle drei Manifestvarianten mit korrekten Netzwerkrechten und Backup-Regeln.
  Manifestprüfungen funktionieren auch ohne privaten Store-Schlüssel.
- Eigene Store-Signatur erfolgreich geöffnet und geprüft. Fehlender Schlüssel
  wird abgelehnt. Effektive Store-Kennung, Signierung, Version und Schutz an
  sechs Verpackungsaufgaben per Gradle geprüft, ohne Store-Artefakt.
- Store-Abhängigkeitsauflösung bestätigt Gson 2.13.2 und Commons IO 2.14.0.
  Expo-Kompatibilitätsprüfung erfolgreich. npm audit verbleibt bei 18 hohen
  Paketeinträgen aus node-forge und braces, ohne kritische Meldung.
- Datenschutzstruktur, Sprachlinks und gemeinsame Abschnitte geprüft.
- Erste Prüfläufe scheiterten an vollem Datenträger. Erzeugte SerienLog-
  Zwischenstände bereinigt, beschädigte Gradle-Ausgaben neu erzeugt und die
  betroffenen Prüfungen erfolgreich wiederholt.

## Auslieferung

- Dev-Preview für arm64-v8a gebaut und auf HONOR BVL_N49 installiert.
  com.appfactory.series_log.dev, Version 1.0.0 (1), nicht debuggable,
  Installer null. Vorhandene Signatur stimmt überein. Update mit adb install
  -r -t -g --no-streaming erfolgreich. App gestartet, Daten nicht gelöscht.
- DEX-Prüfung bestätigt Commons-IO-Dateikopien über j$.nio.file und die
  mitgelieferte Files-Klasse. Android 7 wurde nicht auf einem realen Gerät geprüft.
- GitHub-Pages-Veröffentlichung und öffentlicher Linktest folgen dem Commit.
  Version bleibt 1.0.0 (1). Kein Store-Build und kein Play-Upload.
  MaschinenLog, ZählerstandLog, LeseLog und Hausakte bleiben unverändert.
