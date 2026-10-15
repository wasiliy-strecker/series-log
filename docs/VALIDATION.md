# Prüfung von SerienLog

## Automatische Prüfung

`npm run check` prüft Formatierung, ESLint, TypeScript und die kleine Testsuite.
Sie deckt Pflichtfelder, unabhängige Staffel-/Folgenangaben, rückwärts erfasste
Stände, SQLite-Persistenz, Entwürfe, Suche, Paginierung, Fotos, PDF-Erzeugung,
verschlüsselte Backups und Erinnerungen ab. Ein gezielter Test speichert zuerst
Staffel 3, Folge 3 und danach Staffel 2, Folge 2. Ehemalige Gesamtzahlen dürfen
keinen dieser Stände blockieren. Ein verschlüsseltes Archiv mit den alten
Serienfeldern, echtem Foto und PDF wird mit Node/OpenSSL erzeugt und importiert.

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

Die Tests ersetzen keine reale Prüfung von Kamera, Android-Energiesparregeln,
Benachrichtigungszustellung und PDF-Druckdiensten. Die zuletzt ausgeführten
Geräteschritte und noch offene Punkte stehen im jeweiligen Task-Changelog.
