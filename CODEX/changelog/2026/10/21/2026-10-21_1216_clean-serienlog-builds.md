# SerienLog-Build-Zwischenstände und ältere Dev-APK bereinigt

Auf ausdrücklichen Nutzerauftrag die 30 zuvor geprüften SerienLog-Build- und
Cache-Verzeichnisse sowie die ältere Dev-APK
`build/dev/serienlog-1.0.0-dev-reminders-2026-10-13.apk` entfernt.

Die erzeugten Android-Build-Zwischenstände einschließlich der Zwischen-AAB
unter `intermediates`, lokale Gradle- und CMake-Zwischenstände und die geprüften
Android-Build-Verzeichnisse nativer Bibliotheken in `node_modules` sind entfernt.
Die installierten Bibliotheken und deren Quelltexte bleiben erhalten.

Die neuere Dev-APK vom 21.10.2026 unter
`android/app/build/outputs/apk/dev/release/app-dev-release.apk` bleibt erhalten.
Alle fertigen Store-AAB-Auslieferungen, Ausgabeordner, Store-Materialien,
Prüfberichte, Quelltexte, Konfigurationen und Signierschlüssel bleiben erhalten.
Das gilt auch für den Dev-Schlüssel unter `.local/` und den privaten
Store-Signaturordner außerhalb des Repositories. Keine Geräteaktionen oder
Änderungen an installierten Apps vorgenommen. ModellbauLog, ZählerLog und
geteilte Gradle-Caches wurden nicht bereinigt.

## Ergebnis und Prüfung

Die Build-Zwischenstände geben 4058517504 Bytes frei. Die ältere Dev-APK gibt
weitere 69332992 Bytes frei. Zusammen sind das 4127850496 Bytes, rund 4,13 GB.
Die Bilanz berücksichtigt Hardlinks und verbleibende externe Verknüpfungen.
Nach Abschluss waren rund 5,9 GB auf dem Ubuntu-Laufwerk frei. GB-Angaben
verwenden die dezimale Einheit.

Vor dem Löschen keine versionierten Dateien innerhalb der Ziele und keine
aktiven Entwicklungsprozesse oder offenen Zugriffe auf diese Ziele gefunden.
Beide Dev-APKs anhand von Dateityp, Größe, ZIP-Kennung und Änderungszeit geprüft.
Alle 31 freigegebenen Ziele sind entfernt. Inhalte beziehungsweise
Symlink-Ziele und Dateimodi von 47427 geschützten Dateien vor und nach dem
Löschen verglichen. Keine Abweichungen festgestellt. Git-Branch, HEAD und
Arbeitsstand blieben während der Bereinigung unverändert.

Nur diese Dokumentation wird versioniert. App- und Workspace-Changelog auf
identischen Inhalt und Diff auf Formatfehler geprüft. Keine Analyse, Tests,
Prüfbuilds oder Installationen, da Laufzeitcode und Projektkonfiguration durch
diese Aufgabe unverändert bleiben. Ein künftiger Build erzeugt benötigte
Zwischenstände erneut.
