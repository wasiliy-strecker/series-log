# SerienLog

SerienLog ist eine eigenständige lokale Android-App für deine Serienabende.
React Native, TypeScript, Expo und SQLite stammen aus der Hausakte-Codebasis.
Bildschirmaufbau und Bedienabläufe orientieren sich an LeseLog. Dunkle Flächen,
weiße Schrift und rote Akzente geben SerienLog ein eigenes Erscheinungsbild.

## Funktionen

- Serien mit Titel, Genre und optionaler Notiz anlegen und bearbeiten
- Staffel und zuletzt vollständig gesehene Folge mit Datum und Uhrzeit speichern
- Optional Fotos aus Kamera oder Galerie und eine Notiz ergänzen
- Aktuellen Stand und Fortschritt in der Serienübersicht sehen
- Zehn aktuelle Folgenstände und vollständigen, durchsuchbaren Verlauf ansehen
- Folgenstände korrigieren oder löschen. Bearbeitungen aktualisieren den Eintrag
- Persönliche lokale Erinnerungen mit den vorhandenen Android-Einstellungen
- Einzel- und Verlaufsprotokolle als PDF speichern, drucken und teilen
- Verschlüsselte `.slbackup`-Backups mit Fotos, PDFs und Erinnerungseinstellungen
- Gesicherte Formularentwürfe bei unterbrochener Eingabe wieder aufnehmen

Kein Konto, kein Server, keine Streaming-Anbindung, keine eigene Telemetrie.

## Bestätigte Folgenlogik

Die Gesamtfolgenzahl ist optional. Sie bezeichnet die Folgen aller Staffeln,
die du verfolgen möchtest. Bei laufenden Serien kannst du sie später erhöhen
oder offen lassen. Bekannte Staffelzahlen werden nicht automatisch als fertige
Gesamtzahl ausgegeben, da weitere Staffeln erscheinen können.

Pro Staffel kann eine Folgenzahl hinterlegt werden. Leere Felder bedeuten
unbekannt. Ein Stand in Staffel 2, Folge 3 bedeutet, dass Staffel 1 vollständig
und die ersten drei Folgen von Staffel 2 gesehen wurden. Wenn Staffel 1 acht
Folgen hat, zeigt die App elf gesehene Folgen. Bei insgesamt 18 Folgen sind das
61 Prozent. Folge 0 bedeutet, dass die betreffende Staffel noch nicht begonnen
wurde. Ausgelassene Folgen und wiederholtes Anschauen werden nicht einzeln gezählt.

„Nächste Staffel“ verlangt die letzte gesehene Folge der aktuellen Staffel.
Eine bekannte Staffellänge muss dazu passen. Nach deiner Bestätigung merkt der
Entwurf den Staffelabschluss vor und wechselt auf Folge 0 der nächsten Staffel.
Erst „Bestätigen & speichern“ übernimmt die Staffellänge und den neuen Stand
in einer gemeinsamen Datenbanktransaktion. Auch manuelle Sprünge in spätere
Staffeln erklären und bestätigen die Annahme abgeschlossener früherer Staffeln.

Ohne Gesamtzahl wird kein Prozentwert gezeigt. Ohne die Längen früherer Staffeln
bleibt auch die kumulierte Folgenzahl offen. Staffel und Folge sind immer sichtbar.
Innerhalb derselben Staffel kann die Differenz zum vorigen Stand trotzdem
angezeigt werden. Staffelübergreifende Differenzen brauchen die dazwischenliegenden
Staffellängen. Nachträglich ergänzte Staffellängen aktualisieren die Berechnung.
Bereits erzeugte PDFs behalten ihren Inhalt.

Der zeitlich neueste Folgenstand bestimmt die Übersicht, auch nach Korrektur oder
Löschung. Ein rückdatierter Eintrag ersetzt keinen neueren Stand. Niedrigere und
zukünftige neue Stände benötigen eine Bestätigung. Der Verlauf zählt gespeicherte
Stände, nicht einzelne Seh-Sitzungen. Serienangaben, die vorhandenen Ständen
widersprechen, werden nicht gespeichert.

## Architektur

`src/app` enthält schlanke Expo-Router-Routen. `src/features` enthält Screens,
View-Model-Hooks und Anwendungsservices. `src/core` enthält eigene lokale Kopien
für UI, Domain, SQLite, Fotos, PDFs und Backups. Android-Gerätefunktionen liegen
im eigenen Expo-Modul `modules/series-native`. Es gibt keine gemeinsame Bibliothek
und keine Laufzeitverbindung zu Hausakte oder LeseLog.

Technische Vorlage: Hausakte `dfd6fc8`. Fachliche Vorlage: LeseLog `a168027`.
Die referenzierten Projekte wurden bei der Erstellung nicht verändert.

LeseLog-spezifische Seiten-OCR, Buchfelder, ISBN und Korrekturrevisionen gehören
nicht zu dieser ersten SerienLog-Version. Folgen werden bewusst eingegeben.
Korrekturen folgen der Hausakte-Implementierung ohne zusätzliche Revisionen.

## Lokale Entwicklung

Node.js 22.13 oder neuer mit `node:sqlite`, npm, Android SDK und JDK 21.
Die Geräteprüfung erfolgt mit einem eigenen Development Build, nicht Expo Go.

```bash
npm ci
npm run check
npm start
```

Metro läuft auf Port 8085. Für die erste Dev-Installation oder native Änderungen:

```bash
npm run build:dev
npm run install:dev -- DEVICE
npm start
```

Das Skript erstellt nur `devDebug`. Der Installer prüft Paketkennung, vorhandene
Version, Debug-Status, Installer und Signatur. Er verwendet ausschließlich
`adb install -r -t -g --no-streaming`. Fast Refresh aktualisiert spätere normale
TypeScript- und UI-Änderungen ohne APK-Build.

Eine eigenständige Dev-Testversion mit eingebettetem JavaScript kann bei Bedarf
mit `npm run build:preview` und `npm run install:preview -- DEVICE` bereitgestellt
werden. Sie benötigt für Codeänderungen ein neues APK-Update.

| Variante | Name          | Android-Paket                   |
| -------- | ------------- | ------------------------------- |
| Dev      | SerienLog Dev | `com.appfactory.series_log.dev` |
| Store    | SerienLog     | `com.appfactory.series_log`     |

Dev und Store haben getrennte Daten. SQLite-Datei: `serienlog.db`.
Backup-Kennung: `serienlog_backup`, Dateikopf: `SLBACK01`.
Fremde Hausakte- oder LeseLog-Backups werden nicht importiert.
Der Dev-Schlüssel wird beim ersten Dev-Build in `.local/dev.keystore` erzeugt
und übersteht `expo prebuild`. Er bleibt außerhalb von Git. Store-Debug ist
abgeschaltet. Store-Releases benötigen vor einer Veröffentlichung eine eigene
private Signatur. Hier wurde kein Store-Build erstellt und nichts veröffentlicht.

## Prüfung und Grenzen

`npm run check` prüft Format, ESLint, TypeScript und die fokussierten Domain-,
SQLite- und Backup-Tests. `npm run check:native` prüft das eigene Android-Modul.
`docs/VALIDATION.md` nennt Ergebnisse und kurze noch offene Geräteprüfschritte.

Backups verwenden AES-256-GCM und PBKDF2-SHA-256 mit 600000 Iterationen, zufälligem
Salt und Nonce. Die vorhandene Grenze beträgt 128 MiB pro Backup. Entwürfe sind
nicht enthalten. Neuere lokale Datensätze bleiben beim Import erhalten.
Datenbankänderungen werden vor dem Entfernen ungenutzter Dateien abgeschlossen.

[Datenschutz](PRIVACY.md). Schriftlizenzen liegen unter `assets/ui/`.
Das SerienLog-Icon ist eine eigene SVG-Grafik unter `assets/serienlog.svg`.
