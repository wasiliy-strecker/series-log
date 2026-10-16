# Prüfung von SerienLog

## Automatische Prüfung

`npm run check` prüft Formatierung, ESLint, TypeScript und die kleine Testsuite.
Sie deckt Pflichtfelder, unabhängige Staffel-/Folgenangaben, rückwärts erfasste
Stände, SQLite-Persistenz, Entwürfe, Suche, Paginierung, Fotos, PDF-Erzeugung,
verschlüsselte Backups und Erinnerungen ab. Ein gezielter Test speichert zuerst
Staffel 3, Folge 3 und danach Staffel 2, Folge 2. Ehemalige Gesamtzahlen dürfen
keinen dieser Stände blockieren. Ein verschlüsseltes Archiv mit den alten
Serienfeldern, echtem Foto und PDF wird mit Node/OpenSSL erzeugt und importiert.

Die Backup-Prüfungen verwenden außerdem eine feste synthetische Sicherung des
bisherigen SerienLog-Codes. Die echten Expo-JavaScript-Schnittstellen laufen im
Test mit einer durch Node/OpenSSL ersetzten nativen Grenze. Geprüft werden
Formatkompatibilität, einzelne und mehrfach referenzierte Dateien, ältere Fotos,
PDFs, Fortschritt, falsches Passwort, beschädigte Inhalte und Schreibfehler.
Weitere Fälle prüfen den atomaren Rückweg bei einem SQLite-Fehler, erhaltene
lokale Entwürfe und neuere Einträge sowie vollständig abgewartete Dateikopien.
Die Tests führen keine Wiederherstellung auf dem Nutzergerät aus.

Die bestehende native Prüfung `npm run check:native` umfasst 44 JVM-Tests und
Android-Lint für das eigene Modul. Sie wurde für die vorherige Änderung der
nativen Erinnerungslogik ausgeführt. Der aktuelle Umbau ändert kein natives Modul.

## Kurze manuelle Abnahme auf einem Gerät

Keine aufwendige visuelle Testreihe. Für den einfachen Folgenstand reichen die
ersten drei Schritte. Die übrigen Schritte dokumentieren bestehende Funktionen.

1. Serie anlegen und bearbeiten. Titel und Genre, optionale Notiz und Erinnerung
   müssen vorhanden sein. Es darf kein Feld für Gesamtfolgen oder Staffellängen
   und keine Aktion zur Staffelverwaltung geben.
2. Ohne Foto einen Stand mit Staffel 3 und Folge 3 speichern. Danach Staffel 2
   und Folge 2 speichern. Beide Vorgänge müssen direkt speichern. Die Übersicht
   muss den zeitlich neuesten Eintrag zeigen. Dashboard, Serie und Verlauf dürfen
   keinen Fortschrittsbalken, Prozentwert oder Zuwachs anzeigen.
3. Staffel und Folge leer lassen und speichern. Unter beiden Pflichtfeldern
   müssen Fehler erscheinen und das Formular zum ersten Fehler scrollen. Null,
   negative Zahlen und Dezimalzahlen müssen am jeweiligen Feld abgelehnt werden.
   Gültige Zahlen mit optionalem Foto und einer Notiz direkt speichern.
4. Einen Stand bearbeiten, rückdatieren und löschen. Übersicht, Verlauf und
   erhaltene Formularentwürfe prüfen. Nur Löschen und Verwerfen benötigen eine
   Bestätigung. Ein niedrigerer Folgenstand darf keine Nachfrage auslösen.
5. Serienprotokoll erzeugen. Die PDF muss Titel, Genre, Staffel, Folge und Datum
   enthalten. Gesamtfolgen, Staffellängen und Differenzspalte dürfen nicht vorkommen.
   Mit Foto darf nur das erste Bild des neuesten Folgenstands erscheinen.
   Hat der neueste Stand kein Foto, darf kein älteres Bild nachrücken. Im
   Einzelprotokoll erscheint nur das erste Foto des ausgewählten Stands.
   Ältere Folgenstände und Notizen bleiben im Verlauf als Text enthalten.
   Vorhandene ältere PDFs bleiben unverändert.
6. Foto aufnehmen, aus Galerie ergänzen, vergrößern, ersetzen und entfernen.
   Das letzte gespeicherte Foto muss im Dashboard und in der Serie erscheinen.
   Neuere Stände ohne Foto verdrängen es nicht. Nach dem Löschen des letzten
   Fotoeintrags wird ein älteres Bild gezeigt. Serien ohne Bild haben keine leere
   Bildfläche.
7. „Beispiele ansehen“ öffnen. Vier Beispiele mit Wischen und Pfeilen ansehen.
   Die Randpfeile müssen deaktiviert sein. Schließen, Android-Zurück und Ziehen
   schließen die Galerie ohne Fotos oder Folgenstände zu übernehmen.
8. Erinnerung aktivieren und „Erinnerung jetzt testen“ verwenden. Serientitel
   und letzter Folgenstand müssen erscheinen. Antippen öffnet die Serie.
   Intervall und Tag ändern, aus- und einschalten. Die Auswahl bleibt erhalten.
   Blockierte Benachrichtigungen, „Nicht stören“ und fehlende Alarmfreigabe zeigen
   passende Hinweise und Android-Einstellungsziele.
9. Bei aktiver Erinnerung „Alarme & Erinnerungen“ öffnen. Nach Rückkehr müssen
   Status und gewählte Erinnerungsart stimmen. Zustellung im Hintergrund und
   nach Geräte-Neustart bei Änderungen der nativen Logik separat prüfen.
10. Verschlüsseltes Backup erstellen und importieren. Fotos, Folgenstände,
    Notizen und Erinnerungen prüfen. Ein älteres SerienLog-Backup mit ehemaligen
    Gesamtzahlen muss ohne neue Staffelabfragen importiert werden können.
    Für eine manuelle Wiederherstellung ein separates Testgerät mit Testdaten
    verwenden. Ältere und aktuelle Fotos müssen enthalten sein, auch wenn die
    PDF-Ausgabe nur das aktuelle Foto verwendet. Formularentwürfe bleiben lokal.
    Passwortbestätigung und Fortschritt prüfen. Speicherortauswahl abbrechen
    und erneut versuchen. Dieselbe vorbereitete Datei muss verfügbar bleiben.
    Nach dem Speichern „Teilen“ prüfen. Ein falsches Passwort oder ein Abbruch
    vor der Übernahme darf keine Datenbankänderung auslösen. Nach einem Fehler
    müssen Ladeanzeige und Bediensperre verschwinden.
11. „Datenschutzerklärung öffnen“ muss zur Seite
    `github.com/wasiliy-strecker/series-log/blob/main/PRIVACY.md` führen.
12. Bei großer Systemschrift und im Querformat kurz prüfen, dass Eingaben,
    Fehlerhinweise und Speichern erreichbar bleiben.
13. Beim Anlegen oder Bearbeiten das Genre-Feld fokussieren. Die Vorschlagsliste
    muss Serientitel und Erinnerung vollständig überdecken. Einen Vorschlag in
    diesem Bereich antippen. Er muss das Genre übernehmen und die Liste schließen.
    Das darunterliegende Titelfeld darf dabei keinen Fokus erhalten und die
    Erinnerung darf nicht umgeschaltet werden.
    Danach Serientitel und Notiz fokussieren. Beide Felder müssen wieder frei
    bedienbar sein. Gefilterte Vorschläge und die Auswahl mit offener Tastatur
    ebenfalls kurz prüfen.
    Android-Zurück zum Schließen der Tastatur und anschließend Antippen außerhalb
    muss die Vorschlagsliste schließen und die Formularfelder freigeben.
14. Gespeicherte Einzel- und Serienverlaufsprotokolle getrennt öffnen. Bei genau
    zehn Dateien darf keine Seitennavigation erscheinen. Ab elf Dateien müssen
    höchstens zehn pro Seite sowie „Seite 1 von 2“, „Zurück“ und „Weiter“ sichtbar
    sein. Nach Weiter muss der Anfang des PDF-Bereichs mit der verbleibenden Datei
    sichtbar werden. Erste und letzte Seite müssen den jeweiligen Randbutton
    deaktivieren. Andere Serien und Folgenstände beginnen auf Seite eins.
    Die Fälle mit elf PDFs, Löschen auf der letzten Seite und Ladefehlern werden
    gezielt mit Testdaten in SQLite und dem echten React-Bereich automatisiert
    geprüft. Dafür keine zusätzlichen PDFs auf dem Nutzergerät anlegen.
15. „PDF-Inhalt wählen“ öffnen und ohne Auswahl schließen. Die abgerundete
    Außenkante des unteren Panels muss einen dünnen, gedeckt roten Rahmen haben
    und sich vom abgedunkelten Hintergrund abheben. Die Löschabfrage eines
    bestehenden Protokolls öffnen und mit „Abbrechen“ schließen. Dieselbe
    dezente Kontur muss den mittigen Dialog umgeben. Keine Datei löschen.
    Datum-/Uhrzeitauswahl, Passwortabfragen, Ladeanzeige und „Beispiele ansehen“
    verwenden denselben Rahmen. Beim Schließen und Ziehen darf er nicht stehen
    bleiben oder Inhalte überdecken.
16. In der Hauptansicht die Serienliste scrollen, eine Serie öffnen und
    zurückkehren. Die Scrollposition muss erhalten bleiben. Eine Serie über die
    Suche finden, die außerhalb des sichtbaren Bereichs lag. Mehrere Zeichen
    hintereinander eingeben. Der Fokus muss im Suchfeld bleiben. Suche ohne
    Treffer, Leeren der Suche und Sortieren nach Titel und Genre kurz prüfen.
    Die Serienbilder bleiben sichtbar. Die FlatList läuft ohne umgebende
    ScrollView. Die automatisierten Tests prüfen diese Abläufe mit 24 Serien.

Die Tests ersetzen keine reale Prüfung von Kamera, Android-Energiesparregeln,
Benachrichtigungszustellung und PDF-Druckdiensten. Die zuletzt ausgeführten
Geräteschritte und noch offene Punkte stehen im jeweiligen Task-Changelog.
