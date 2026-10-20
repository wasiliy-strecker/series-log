# SerienLog

SerienLog ist eine eigenständige lokale Android-App für deine Serienabende.
React Native, TypeScript, Expo und SQLite stammen aus der Hausakte-Codebasis.
Bildschirmaufbau und Bedienabläufe orientieren sich an LeseLog. Dunkle Flächen,
weiße Schrift und rote Akzente geben SerienLog ein eigenes Erscheinungsbild.

## Funktionen

- Serien mit Titel, Genre und optionaler Notiz anlegen und bearbeiten
- Staffel und zuletzt vollständig gesehene Folge mit Datum und Uhrzeit speichern
- Optional Fotos aus Kamera oder Galerie und eine Notiz ergänzen
- Foto-Hinweise und vier Beispielfotos vor dem Erfassen eines Folgenstands ansehen
- Letzte gespeicherte Staffel und Folge in der Serienübersicht sehen
- Letztes Serienbild auf dem Dashboard und in den Seriendetails sehen und dort vergrößern
- Zehn aktuelle Folgenstände und vollständigen, durchsuchbaren Verlauf ansehen
- Folgenstände korrigieren oder löschen. Bearbeitungen aktualisieren den Eintrag
- Persönliche lokale Erinnerungen mit den vorhandenen Android-Einstellungen
- Einzel- und Verlaufsprotokolle als PDF speichern, drucken und teilen
- Verschlüsselte `.slbackup`-Backups mit Fotos, PDFs und Erinnerungseinstellungen
- Gesicherte Formularentwürfe bei unterbrochener Eingabe wieder aufnehmen

Kein Konto, kein Server, keine Streaming-Anbindung, keine eigene Telemetrie.

Beim Start erscheint das eigene SerienLog-Icon auf dunklem Hintergrund. Sobald
die erste Ansicht bereit ist, blendet sie in 180 Millisekunden ein. Es gibt keine
zusätzliche Mindestwartezeit. Fehler beim Start bleiben mit Wiederholen erreichbar.

Genre-Vorschläge erscheinen je nach verfügbarem Platz oberhalb oder unterhalb
des Feldes. Die Liste bleibt über dem Formular unabhängig scrollbar und passt
sich an Tastatur und Bildschirmgröße an. Eigene Genres sind weiterhin möglich.

## Einfacher Folgenstand

Beim Anlegen einer Serie werden Titel, Genre, optionale Notiz und Erinnerung
erfasst. Es gibt keine Gesamtfolgenzahl und keine Verwaltung von Staffellängen.

Jeder Folgenstand enthält die Pflichtfelder Staffel und Folge. Beide müssen
positive ganze Zahlen sein. Datum und Uhrzeit werden vorbelegt und können
geändert werden. Ein Foto und eine Notiz bleiben optional. Speichern übernimmt
den Eintrag direkt ohne Staffelwechsel- oder Rücksprungbestätigung. Staffel und
Folge werden unabhängig von früheren Einträgen geprüft.

Du kannst zuerst Staffel 3, Folge 3 und später Staffel 2, Folge 2 speichern.
Die App bewertet diese Reihenfolge nicht. Sie berechnet weder gesehene
Gesamtfolgen noch Prozentwerte, Fortschrittsbalken oder Differenzen im Verlauf.
Der zeitlich neueste Eintrag bestimmt die Übersicht. Ein rückdatierter Eintrag
bleibt im Verlauf. Korrigieren und Löschen aktualisieren die Übersicht.

Ältere Serien und Backups bleiben lesbar. Ihre ehemaligen Gesamtzahlen und
Staffellängen werden beim Einlesen ignoriert. Bestehende Folgenstände, Fotos,
Notizen und Erinnerungen bleiben erhalten. Auch früher gespeicherte Folge-0-
Einträge bleiben lesbar. Neue oder bearbeitete Stände brauchen eine Folge ab 1.
Bereits erzeugte PDFs behalten ihren Inhalt. Neue PDFs zeigen die gespeicherten
Folgenstände ohne Fortschrittsberechnung oder Differenzspalte.

Als Serienbild erscheint das erste Foto des zeitlich neuesten gespeicherten
Folgenstands mit Foto. Neuere Stände ohne Foto verdrängen es nicht. Auch Bilder
aus älteren Einträgen außerhalb der ersten Verlaufsseite werden berücksichtigt.
Entwürfe dienen nicht als Vorschaubild. Nach Bildänderungen oder Löschungen
aktualisiert sich die Vorschau und greift gegebenenfalls auf ein älteres Bild
zurück. In den Seriendetails lässt sich das Original durch Antippen öffnen.

Die Hauptansicht verwendet wie MaschinenLog eine virtualisierte FlatList.
Suche und Sortierung berücksichtigen weiterhin alle Serien. Suchfeld und Liste
bleiben beim Zurückkehren aus einer Serie erhalten.

## Gespeicherte PDF-Protokolle

Einzelprotokolle eines Folgenstands und Serienverlaufsprotokolle werden getrennt
angezeigt. Wie in MaschinenLog lädt jede Seite höchstens zehn PDF-Metadaten aus
SQLite. Ab elf Dateien erscheinen „Seite x von y“, „Zurück“ und „Weiter“.
Beim Blättern scrollt die Ansicht zum Beginn des gespeicherten PDF-Bereichs.
Nach dem Löschen der letzten Datei einer Seite wird die vorherige gültige Seite
angezeigt. Ein anderer Eintrag oder eine andere Serie beginnt auf Seite eins.
Ladefehler lassen sich erneut versuchen. Der gespeicherte Serienverlauf bleibt
einklappbar. Vorhandene PDF-Dateien behalten ihren Inhalt.

Neue PDFs mit Foto zeigen höchstens ein Bild. Im Einzelprotokoll ist es das
erste Foto des gewählten Folgenstands. Im Serienverlauf ist es das erste Foto
des zeitlich neuesten Folgenstands mit Foto. Neuere Stände ohne Foto verdrängen
dieses Bild nicht. Die Option bleibt verfügbar, solange ein gespeicherter
Folgenstand der Serie ein Foto enthält. Alle Stände und Notizen bleiben als
Text enthalten. Entwürfe und Fotos anderer Serien werden nicht verwendet.
Weitere gespeicherte Fotos bleiben in der App und im Backup erhalten.
Vorhandene PDF-Dokumente können weiterhin eingebettet werden.

Die Auswahl unter „PDF erstellen“ lautet einfach „PDF mit Foto erstellen“ oder
„PDF ohne Foto erstellen“. Gespeicherte PDFs tragen „Mit Foto“ oder „Ohne Foto“.

## Erinnerungen zum Weiterschauen

Das Formular und die Statusanzeigen folgen MaschinenLog und dessen
ZählerstandLog-Vorlage. Erinnerungen bleiben optional und lokal. Es gibt
stündliche, tägliche, wöchentliche, monatliche und jährliche Termine. Beim
stündlichen Intervall lassen sich Startdatum und Startzeit getrennt wählen.
Der nächste Termin wird vor dem Speichern angezeigt.

Neue Erinnerungen verwenden den aktuellen Tag bis maximal 28, den aktuellen
Monat, 09:00 Uhr und für stündliche Termine die nächste volle Stunde.
Gespeicherte Tage 29 bis 31 bleiben gültig. Intervall, Tag und Uhrzeit bleiben
beim Aus- und Einschalten im selben Formular erhalten.

„Normale Erinnerung“ kann verzögert erscheinen und berücksichtigt „Nicht
stören“. „Pünktlich mit Ton“ öffnet bei fehlender Freigabe „Alarme &
Erinnerungen“. Blockierte Benachrichtigungen, gesperrte Erinnerungsarten und
„Nicht stören“ erhalten eigene Hinweise mit passenden Android-Einstellungen.
Nach Rückkehr liest die App den Zustand erneut. Die vorhandenen Kanal-IDs und
damit die Einstellungen für diese Kategorien bleiben erhalten.

„Erinnerung jetzt testen“ zeigt Serientitel, Genre und den letzten Folgenstand.
Antippen öffnet die gespeicherte Serie. Bei einer noch nicht gespeicherten Serie
öffnet die Testmeldung die App. Sie verschwindet nach einer Minute. Erfolg,
Blockierung und technische Fehler werden getrennt gemeldet. Die
Erfolgsrückmeldung bleibt acht Sekunden sichtbar.

Übersicht und Seriendetails zeigen ausstehende, blockierte oder fehlgeschlagene
Termine. Eine nicht bestätigte Planung lässt sich auch ohne Feldänderung mit
„Erinnerung erneut speichern“ reparieren. Gespeicherte Seriendaten und
Planungsprobleme werden getrennt gemeldet.

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

Store und Dev-Preview besitzen weder `INTERNET` noch `ACCESS_NETWORK_STATE`.
Nur Dev-Debug behält Netzwerkzugriff für Metro. Die Manifest-Overlays werden vom
Expo-Plugin erhalten. `npm run check:permissions` prüft die zusammengeführten
Manifeste aller drei Varianten, ohne eine Store-APK oder AAB zu erzeugen.
Der Preview-Installer lehnt APKs mit Netzwerkrechten vor jedem Gerätezugriff ab.
Browserlinks und das Teilen von Dateien verwenden weiterhin externe Apps.

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

Expo bleibt auf SDK 57 mit den kompatiblen Patches aus MaschinenLog. React
bleibt auf 19.2.3 und React Native auf 0.86.3. Der Abhängigkeitsprüfstand und
verbleibende Audit-Meldungen stehen in `docs/DEPENDENCIES.md`.

Backups verwenden AES-256-GCM und PBKDF2-SHA-256 mit 600000 Iterationen, zufälligem
Salt und Nonce. SHA-256 und AES-GCM laufen auf Android über die vorhandenen
nativen Expo-Crypto-Funktionen. Die Schlüsselableitung verwendet ab Android 8
den bestehenden nativen PBKDF2-Port. Android 7 behält seinen bisherigen
kompatiblen PBKDF2-Pfad. Native Fehler brechen den Vorgang ab.

Die Sicherung enthält alle gespeicherten Serien, Folgenstände, Notizen,
Erinnerungseinstellungen, älteren und aktuellen Fotos sowie gespeicherten PDFs.
Jede eindeutige Datei wird beim Erstellen einmal gelesen und einmal gehasht.
Die Formatkennung und der Dateiaufbau bleiben unverändert. Bestehende
`.slbackup`-Dateien bleiben lesbar. Fortschrittsanzeigen zeigen die Phase und
bei Dateioperationen die Anzahl. Nach abgebrochener oder fehlgeschlagener
Speicherortauswahl kann dieselbe verschlüsselte Datei erneut gespeichert werden.
Nach dem Speichern lässt sie sich teilen.

Die vorhandene Grenze beträgt 128 MiB pro Backup. Formularentwürfe sind nicht
enthalten und bleiben beim Import lokal erhalten. Neuere lokale Datensätze
bleiben erhalten. Vor dem Übernehmen werden die entschlüsselten Inhalte sowie
die vollständig geschriebenen Dateien einschließlich Hash und Größe geprüft.
Dateiverschiebungen und Kopien werden abgewartet. Die Datenbank wird atomar
übernommen. Erst danach werden ungenutzte Dateien entfernt.

[Datenschutz](PRIVACY.md). Schriftlizenzen liegen unter `assets/ui/`.
Das SerienLog-Icon ist eine eigene SVG-Grafik unter `assets/serienlog.svg`.
