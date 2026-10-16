# Backup und Wiederherstellung nach MaschinenLog

Ausgangsstand `4ba4a68` war sauber committet. Backup-Code, Fortschritt,
Speicherablauf und gezielte Tests in MaschinenLog gelesen. Die Umsetzung bleibt
app-lokal mit React Native, TypeScript, Expo und SQLite. Vorlagen unverändert.

Einen austauschbaren Kryptografie-Port mit nativer Expo-Implementierung für
SHA-256 und AES-256-GCM ergänzt und im Produktionsaufbau verdrahtet. Die vorhandene
PBKDF2-SHA256-Ableitung mit 600000 Runden und Android-Kompatibilität bleibt erhalten.
Eigene Kennungen `SLBACK01`, `serienlog_backup` und `.slbackup` sowie der bisherige
Dateiaufbau bleiben unverändert. Native Fehler brechen den Vorgang mit einer
Fehlermeldung ab. Abgeleitete Schlüsselbytes und Klartext-Payload werden auch im
Fehlerfall bereinigt.

Beim Erstellen jede eindeutige Datei einmal lesen und einmal hashen. Alle
gespeicherten Serien, Folgenstände, Notizen, Erinnerungseinstellungen, älteren
und aktuellen Fotos sowie PDFs bleiben enthalten. Formularentwürfe bleiben wie
mit dem Nutzer besprochen lokal. Beim Wiederherstellen eingehende Referenzen
prüfen, Dateien vollständig schreiben und die tatsächlich gespeicherten Bytes
anhand von Hash und Größe kontrollieren. Prüfungen pro Wiederherstellung cachen.
Erst danach die Datenbank atomar übernehmen. Fehler räumen vorbereitete Dateien
auf. Neuere lokale Einträge, zugehörige Entwürfe und bestehende Dateien bleiben
geschützt. Erinnerungen nach erfolgreicher Übernahme aktualisieren.

Phasen und Dateizähler im vorhandenen Lade-Dialog ergänzt. Passwortbestätigung,
Speicherortauswahl, erneutes Speichern derselben verschlüsselten Datei, Teilen
und Fehlerrückmeldungen folgen MaschinenLog. Alle asynchronen `move`-/`copy`-
Operationen abwarten, auch beim Teilen einzelner und mehrteiliger PDFs.
README und manuelle Prüfschritte aktualisiert.

`npm run check` mit Prettier, ESLint, TypeScript und allen 63 Tests erfolgreich.
Die zusätzlichen Fälle prüfen einen vor der Umstellung mit dem bisherigen Code
erzeugten festen synthetischen Backup-Container, die echten Expo-JavaScript-
Schnittstellen mit Node/OpenSSL an der nativen Grenze, Dateizähler und
genau einen Lese-/Hashvorgang je Datei. Weitere Fälle prüfen falsches Passwort,
fremde Kennungen, manipulierte Daten, ungültige Bilder/PDFs, beschädigte
Dateischreibvorgänge, SQLite-Rollback, lokale Entwürfe, neuere Einträge,
Speicherfehler mit Wiederholung sowie verzögerte Dateikopien und Verschiebungen.
Das eigene Android-Modul und native Abhängigkeiten wurden nicht verändert.

Die eigenständige Dev-Version enthält ihr JavaScript als eingebettetes Bundle.
Für das Geräteupdate die APK inkrementell mit `:app:assembleDevRelease` aus dem
vorhandenen nativen Projekt gebaut, erfolgreich in 59 Sekunden.
`install:preview` prüfte Paket `com.appfactory.series_log.dev`, Version `1.0.0`,
Versionscode `1`, fehlendes Debug-Flag, Installer `null` und die übereinstimmenden
Signaturzertifikate. Datenbewahrend installiert und den Start angefordert.
Der App-Prozess läuft. Das Smartphone blieb gesperrt, daher keine Sichtprüfung
oder manuelle Backup-Erstellung/-Wiederherstellung am Nutzergerät ausgeführt.

Changelog in den gleichnamigen Workspace-Pfad kopiert. Formatierung und
Git-Whitespace-Prüfung erfolgreich. Lokaler Commit nach Abschluss. Keine
Versionsanhebung, kein Store-Build und kein Push.
