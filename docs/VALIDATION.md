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
Android-Lint für das eigene Modul.

Starttests prüfen die Freigabe erst nach Layout, Daten und verschachtelten
Ladevorgängen sowie die erreichbare Fehleransicht. Genre-Tests prüfen
Platzberechnung, Tastaturänderungen, Formularbewegungen, freie Eingaben,
Auswahl, Außenberührungen und Android-Zurück. Die nativen Layout- und
Tastaturschnittstellen sind dabei ersetzt. Eine tatsächliche Geräteansicht
wird dadurch nicht simuliert.

`npm run check:permissions` führt nur die Manifest-Merges für Store, Dev-Preview
und Dev-Debug aus. Store und Preview dürfen keine Internet- oder Netzwerkstatus-
Berechtigung enthalten. Debug muss INTERNET für Metro behalten. Die Vorschau-
Installationshilfe wird zusätzlich mit synthetischen SDK-Werkzeugen getestet.
Unzulässige Netzwerkrechte müssen vor jedem Gerätezugriff zum Abbruch führen.
Der Abhängigkeits- und Audit-Prüfstand steht in `DEPENDENCIES.md`.

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
   Mit Foto darf nur das erste Bild des neuesten Folgenstands mit Foto erscheinen.
   Auch nach neueren Ständen ohne Foto muss „PDF mit Foto erstellen“ verfügbar bleiben.
   „PDF erstellen“ öffnet genau die beiden Aktionen „PDF mit Foto erstellen“ und
   „PDF ohne Foto erstellen“. Lange Erklärtexte entfallen. Nur bei fehlendem Foto
   erscheint „Kein Foto vorhanden.“ unter der deaktivierten Foto-Aktion.
   Gespeicherte PDFs und neu erzeugte Dokumente verwenden „Mit Foto“ oder „Ohne Foto“.
   Suche und Seitenwechsel im Verlauf dürfen die Verfügbarkeit nicht einschränken.
   Im Einzelprotokoll erscheint nur das erste Foto des ausgewählten Stands.
   Einzelprotokolle ohne Foto übernehmen kein Bild aus anderen Folgenständen.
   Entwürfe und andere Serien beeinflussen die Auswahl nicht.
   Ältere Folgenstände und Notizen bleiben im Verlauf als Text enthalten.
   Das aktuelle Foto bekommt wie in MaschinenLog eine eigene Seite mit Eintrag,
   Folgenstand und Dateiname. Es ist deutlich größer, proportional und horizontal
   zentriert. Die dünne Kontur liegt direkt am Bild. Nachfolgende Einträge beginnen
   auf einer neuen Seite. Hoch- und Querformat bleiben vollständig sichtbar.
   Vorhandene ältere PDFs bleiben unverändert.
6. Foto aufnehmen, aus Galerie ergänzen, vergrößern, ersetzen und entfernen.
   Das letzte gespeicherte Foto muss im Dashboard und in der Serie erscheinen.
   Neuere Stände ohne Foto verdrängen es nicht. Nach dem Löschen des letzten
   Fotoeintrags wird ein älteres Bild gezeigt. Serien ohne Bild haben keine leere
   Bildfläche.
   Das Drei-Punkte-Menü eines Fotos öffnet ein abgerundetes unteres Panel mit
   dezenter Außenkontur. „Foto ersetzen“ und „Foto entfernen“ haben Symbole,
   kurze Hilfetexte und große abgerundete Aktionsflächen. Entfernen ist rot
   hervorgehoben. Ersetzen öffnet die Kamera-/Galerie-Auswahl im gleichen Stil.
   Bei mehreren Fotos bleiben Nach-vorne-/Nach-hinten-Aktionen verfügbar und
   am jeweiligen Ende deaktiviert. Android-Zurück, Außenberührung und Herunterziehen
   schließen die Auswahl ohne Änderungen. Für die Sichtprüfung auf dem Nutzergerät
   keine Fotos ersetzen oder entfernen.
7. „Beispiele ansehen“ öffnen. Vier Beispiele mit Wischen und Pfeilen ansehen.
   Die Randpfeile müssen deaktiviert sein. Schließen, Android-Zurück und Ziehen
   schließen die Galerie ohne Fotos oder Folgenstände zu übernehmen.
8. Erinnerung aktivieren und „Erinnerung jetzt testen“ verwenden. Serientitel
   und letzter Folgenstand müssen erscheinen. Antippen öffnet die Serie.
   Test-Erinnerung und reguläre Erinnerung verwenden das SerienLog-Symbol und
   den roten Akzent #E50914, soweit Androids Benachrichtigungsdesign ihn zeigt.
   Dies für „Normal“ und „Pünktlich mit Ton“ prüfen.
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
    enthält genau sechs deutsche Genres: Drama, Komödie, Krimi, Abenteuer,
    Zeichentrick und Dokumentation. Bei wenig Platz bleiben sie in der Liste
    scrollbar. Gespeicherte eigene oder frühere englische Genres dürfen keine
    zusätzlichen Vorschläge erzeugen. Beim Bearbeiten bleiben solche Angaben
    im Eingabefeld unverändert. Freie Eingaben und die Auswahl von „Komödie“
    speichern und erneut öffnen. Auch der Platzhalter verwendet „Komödie“.
    Die Genre-Texte liegen mit stabilen Schlüsseln im deutschen Sprachkatalog
    unter src/core/i18n. Die App bleibt vorerst durchgehend auf Deutsch.
    Die Vorschlagsliste muss vollständig vor dem Formular liegen. Mit offener
    Tastatur oben und unten im Formular sowie kurz im Querformat prüfen.
    Bei Platzmangel unterhalb
    muss sie oberhalb öffnen und im sichtbaren Bereich bleiben. Durch die Liste
    scrollen. Das Formular darf dabei nicht mitscrollen. Einen Vorschlag antippen.
    Er muss das Genre übernehmen und die Liste schließen.
    Das darunterliegende Titelfeld darf dabei keinen Fokus erhalten und die
    Erinnerung darf nicht umgeschaltet werden.
    Danach Serientitel und Notiz fokussieren. Beide Felder müssen wieder frei
    bedienbar sein. Gefilterte Vorschläge und die Auswahl mit offener Tastatur
    ebenfalls kurz prüfen.
    Android-Zurück oder Antippen außerhalb muss die Vorschlagsliste schließen
    und die Formularfelder freigeben. Die Außenberührung darf weder ein anderes
    Feld aktivieren noch Speichern auslösen. Das Genre-Feld selbst bleibt auch
    mit geöffneter Liste für Textkorrekturen erreichbar.
14. Gespeicherte Einzel- und Serienverlaufsprotokolle getrennt öffnen. Bei genau
    zehn Dateien darf keine Seitennavigation erscheinen. Ab elf Dateien müssen
    höchstens zehn pro Seite sowie „Seite 1 von 2“, „Zurück“ und „Weiter“ sichtbar
    sein. Nach Weiter muss der Anfang des PDF-Bereichs mit der verbleibenden Datei
    sichtbar werden. Erste und letzte Seite müssen den jeweiligen Randbutton
    deaktivieren. Andere Serien und Folgenstände beginnen auf Seite eins.
    Die Fälle mit elf PDFs, Löschen auf der letzten Seite und Ladefehlern werden
    gezielt mit Testdaten in SQLite und dem echten React-Bereich automatisiert
    geprüft. Dafür keine zusätzlichen PDFs auf dem Nutzergerät anlegen.
15. „PDF erstellen“ öffnen und ohne Auswahl schließen. Die abgerundete
    Außenkante des unteren Panels muss einen dünnen, gedeckt roten Rahmen haben
    und sich vom abgedunkelten Hintergrund abheben. Die Löschabfrage eines
    bestehenden Protokolls öffnen und mit „Abbrechen“ schließen. Dieselbe
    dezente Kontur muss den mittigen Dialog umgeben. Keine Datei löschen.
    Datum-/Uhrzeitauswahl, Passwortabfragen, Ladeanzeige und „Beispiele ansehen“
    verwenden denselben Rahmen. Beim Schließen und Ziehen darf er nicht stehen
    bleiben oder Inhalte überdecken.
    „Serie speichern“, „Änderungen speichern“ und andere gefüllte oder
    umrandete Standardbuttons müssen wie in MaschinenLog pillenförmig gerundet
    sein. Textbuttons bleiben ohne Füllung, reine Symbolbuttons ohne Rahmen.
    Der schwebende Anlegen-Button behält seine weniger starke Rundung.
    Geräteabnahme am 20. Oktober 2026, 19:08: Die eigenständige Dev-Preview
    von `e3115ff` ist datenbewahrend installiert. Ein neuer Screenshot bestätigt
    pillenförmige umrandete Bearbeiten-/Löschen-Buttons und die gefüllte
    Erstellen-Aktion. Vorhandene Serien und der gespeicherte Entwurf sind erhalten.
16. In der Hauptansicht die Serienliste scrollen, eine Serie öffnen und
    zurückkehren. Die Scrollposition muss erhalten bleiben. Eine Serie über die
    Suche finden, die außerhalb des sichtbaren Bereichs lag. Mehrere Zeichen
    hintereinander eingeben. Der Fokus muss im Suchfeld bleiben. Suche ohne
    Treffer, Leeren der Suche und Sortieren nach Titel und Genre kurz prüfen.
    Die Serienbilder bleiben sichtbar. Die FlatList läuft ohne umgebende
    ScrollView. Die automatisierten Tests prüfen diese Abläufe mit 24 Serien.
17. Eine gespeicherte Sitzung regulär schließen und die Dev-Preview neu öffnen.
    Das SerienLog-Icon muss auf dunklem Hintergrund vollständig sichtbar sein.
    Die fertige Übersicht blendet kurz und weich ein, ohne weiße Zwischenfläche.
    Keine zusätzliche Wartezeit und kein erneutes Startbild beim Wechsel zwischen
    Seiten. Die eigentliche Gerätedarstellung wird mit der eigenständigen Preview
    geprüft, nicht mit Expo Go. Danach den GitHub-Link öffnen und eine vorhandene
    Datei über den Android-Dialog teilen. Dafür bleiben externe Apps zuständig.

Die Tests ersetzen keine reale Prüfung von Kamera, Android-Energiesparregeln,
Benachrichtigungszustellung und PDF-Druckdiensten. Die zuletzt ausgeführten
Geräteschritte und noch offene Punkte stehen im jeweiligen Task-Changelog.

Für eine gezielte Entwicklerprüfung der Fehlerbehandlung beim Wechsel der
Erinnerungsart einen Fehler von `refreshStatus` simulieren. Bei „Normal“ muss
„Der Erinnerungsstatus konnte nicht bestätigt werden.“ erscheinen. Bei
„Pünktlich mit Ton“ muss der Hinweis auf „Alarme & Erinnerungen“ samt erhaltener
Auswahl erscheinen. Beide Fälle müssen die Bediensperre wieder aufheben und
die gewählte Erinnerungsart beibehalten. Auch das fehlgeschlagene Öffnen der
Alarmfreigabe muss denselben passenden Hinweis liefern.
