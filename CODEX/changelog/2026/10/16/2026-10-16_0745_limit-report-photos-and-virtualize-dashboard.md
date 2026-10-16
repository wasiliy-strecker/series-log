# Aktuelles PDF-Foto und FlatList für die Serienübersicht

Ausgangsstand `900e171` war sauber committet. Die FlatList samt Suchkopf,
Fokusverhalten und gezielten Tests in MaschinenLog als Referenz gelesen.
MaschinenLog und die anderen Vorlagen bleiben unverändert.

PDF-Protokolle mit Foto enthalten jetzt höchstens das erste Foto des ausgewählten
Folgenstands. Im Serienverlaufsprotokoll wird nur das erste Foto des zeitlich
neuesten Stands eingebettet. Bei diesem Stand ohne Foto rückt kein älteres Bild
nach. Diese Auslegung als Empfehlung zur Auswahl gestellt und anschließend
transparent als Annahme umgesetzt. Ältere Stände und Notizen bleiben im PDF als
Text erhalten. Vorhandene PDF-Anhänge bleiben unterstützt. Ausgeschlossene Fotos
werden weder gelesen noch in die Dateigrößengrenze eingerechnet. Die Prüfung der
tatsächlich berücksichtigten Dateien bleibt erhalten. Gespeicherte Fotos,
Backups und bestehende PDFs werden nicht verändert. Auswahltexte und die
Verfügbarkeit der Foto-Variante im Serienverlauf entsprechend angepasst.

Die Hauptansicht verwendet wie MaschinenLog eine FlatList ohne umgebende
ScrollView. Eigenständiger Suchkopf, stabile Serienkennungen, variable
Kartenhöhen und Abstand zum schwebenden Anlegen-Button. Suche und Sortierung
gelten für alle Serien. Daten werden beim Zurückkehren im Hintergrund geladen,
damit Liste und Suchfeld erhalten bleiben. Serienbilder behalten ihre bisherige
Auswahl einschließlich eines älteren Bilds bei neueren Ständen ohne Foto.

`npm run check` mit Formatierung, ESLint, TypeScript und allen 26 Tests erfolgreich.
Drei gezielte Listentests prüfen 24 Serien, Suche außerhalb des sichtbaren
Bereichs, Sortierung, Navigation, erhaltene Komponenten und Fehler mit Wiederholung.
Drei PDF-Tests prüfen echte erzeugte Bildobjekte, Datumsreihenfolge, Einzel- und
Verlaufsprotokoll, erhaltene Notizen und PDF-Anhänge, kompakte Ausgabe und den
Unterschied zwischen ausgeschlossenen und fehlenden berücksichtigten Fotos.
README und manuelle Prüfschritte ergänzt. Keine aufwendige visuelle Testreihe.

Die eigenständige Dev-Installation enthält ihr JavaScript als eingebettetes
Bundle. Deshalb die Dev-APK inkrementell mit `:app:assembleDevRelease` gebaut,
erfolgreich in 44 Sekunden. `install:preview` prüfte Paket
`com.appfactory.series_log.dev`, Version `1.0.0`, Versionscode `1`, fehlendes
Debug-Flag, Installer `null` und die übereinstimmenden Signaturzertifikate.
Datenbewahrend installiert und Start angefordert. Das Smartphone blieb gesperrt,
deshalb keine Sichtprüfung der laufenden Oberfläche. Keine Testeinträge oder
zusätzlichen PDFs auf dem Nutzergerät erstellt.

Changelog in den gleichnamigen Workspace-Pfad kopiert. Formatierung und
Git-Whitespace-Prüfung erfolgreich. Lokaler Commit nach Abschluss. Keine
Versionsanhebung, kein Store-Build und kein Push.
