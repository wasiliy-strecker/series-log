# Entwicklungs-Caches bereinigt und Systemjournal begrenzt

Auf ausdrücklichen Nutzerauftrag die erzeugten Android-Build-Zwischenstände
von Hausakte, MaschinenLog, ModellbauLog und SerienLog entfernt. Dazu gehören
projektbezogene Gradle- und CMake-Zwischenstände sowie die erzeugten Android-
Build-Verzeichnisse innerhalb von `node_modules`. Die benötigten Bibliotheken,
Quelltexte, Konfigurationen, persönlichen Dateien und Signierschlüssel bleiben
unverändert. Fertige APKs, AABs und deren Ausgabeordner bleiben erhalten.

Zusätzlich ausschließlich die gemeinsamen `transforms`-Caches der Gradle-
Versionen 8.14 und 9.3.1 entfernt. Heruntergeladene Abhängigkeiten, Gradle-
Distributionen, Java-Installationen und die übrigen Gradle-Dateien bleiben erhalten.
Der nächste Android-Build erzeugt die benötigten Zwischenstände erneut und
braucht deshalb länger. Es wurden keine Apps installiert oder deinstalliert.

## Systemjournal

Die eigene Konfigurationsdatei
`/etc/systemd/journald.conf.d/99-local-storage-limit.conf` setzt
`SystemMaxUse=500M`. Journald neu gestartet und ältere Journaldateien mit
`journalctl --rotate --vacuum-size=500M` bereinigt. Die bisherige
Journald-Konfiguration bleibt unverändert. Ältere Diagnoseeinträge wurden
entfernt. Neue Meldungen werden weiter protokolliert.

Die wirksame Grenze ist 500 MiB. Der Journalverbrauch sank von
3651170304 auf 515801088 Bytes.
Der Dienst läuft. Die Startmeldung bestätigt `max 500.0M`.

## Ergebnis und Prüfung

Die Inode-Bilanz der Build- und Transform-Caches ergibt
27169918976 freigegebene Bytes, rund 27,2 GB.
Mehrfach verknüpfte Dateien wurden nur einmal gezählt und verbliebene externe
Verknüpfungen berücksichtigt. Die Journalbereinigung gab weitere
3135369216 Bytes frei. Zusammen sind das rund 30.3 GB.
Zum Abschluss waren ungefähr 31.0 GB auf dem Ubuntu-Laufwerk frei.
GB-Angaben verwenden die dezimale Einheit.

Vor der Bereinigung keine aktiven Builds oder Dateizugriffe auf die freigegebenen
Ziele festgestellt. Keine versionierten Dateien innerhalb der Löschziele gefunden.
Inhalte beziehungsweise Symlink-Ziele von 232480 geschützten Dateien
vor und nach der Bereinigung verglichen. Keine Abweichungen festgestellt.
Alle freigegebenen Ziele wurden entfernt und der ursprüngliche Git-Arbeitsstand
der vier Apps blieb erhalten.

Nur die vorgeschriebenen Changelog-Kopien werden versioniert. Inhalt und Diff
auf Formatfehler geprüft. Keine Analyse, Tests, Prüfbuilds oder Geräteaktionen,
da Laufzeitcode und Projektkonfiguration unverändert sind.
