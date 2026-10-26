# SerienLog: Build-Caches bereinigt

Auf Nutzerauftrag die geprüften erzeugten Build-Zwischendateien und lokalen
Caches entfernt. Die Inode-Bilanz ergibt 3.435.741.184 freigegebene Bytes.

Erzeugte Android-, Gradle-, CMake- und Bibliotheks-Build-Zwischenstände sowie
vorhandene Bundle-Prüfcaches entfernt. Quellen und installierte
Bibliotheksquellen, fertige APKs/AABs, Auslieferungsordner, Store-Grafiken und
Signierschlüssel bleiben erhalten. Hausakte, gemeinsame Werkzeug-Caches und
andere Projekte wurden nicht bereinigt. Laufende Emulatoren blieben erhalten.

Benötigte Zwischenstände werden beim nächsten Build neu erzeugt.

## Prüfung

Vor dem Löschen keine versionierten Dateien oder offenen Dateizugriffe in den
freigegebenen Zielen festgestellt. Projektübergreifend Metadaten beziehungsweise
Symlink-Ziele von 140.398 geschützten Dateien verglichen. Zusätzlich 3.034
wichtige Dateien, darunter Quellen, Auslieferungen und Schlüssel, per SHA-256
geprüft. Keine Abweichungen. Die ursprünglichen Git-Arbeitsstände einschließlich
der vorhandenen nicht committeten ModellbauLog-Änderungen blieben erhalten.

Nur die Changelog-Dateien werden lokal versioniert. Inhalt und Diff auf
Formatfehler geprüft. Keine Codeänderungen, Prüfbuilds, Geräteaktionen oder
Pushes durchgeführt.
