# Build the first SerienLog Store release

Auf ausdrücklichen Auftrag die erste signierte Store-AAB erstellt. Version
1.0.0 (1) ist die erste bekannte Store-Auslieferung. Es gab keine frühere
benannte AAB und keinen bekannten hochgeladenen Versionscode.

Den Release-Helfer und Artefaktprüfer aus MaschinenLog app-lokal angepasst.
Eigene Paketkennung, Name und vorhandenes Upload-Zertifikat verwendet.
Keine gemeinsame Bibliothek und keine Änderungen an Referenz-Apps.
Der Helfer prüft Signatur, Kennung, Version, Berechtigungen, Backup-Flags,
eingebettetes JavaScript und 16-KB-Ausrichtung vor der benannten Auslieferung.
Vorhandene Dateien werden nicht überschrieben. Anleitung und README ergänzt.

Beim aktuellen npm-Audit zusätzlich Vite 8.3.0 als betroffen erkannt.
Gezielt auf das kompatible Vite 8.3.5 samt Hilfspaketen aktualisiert.
Keine erzwungenen Downgrades. Beide Audits verbleiben bei 18 hohen Einträgen
aus den bekannten Build-Werkzeug-Ursachen node-forge und braces. Keine
kritischen Meldungen. Bewertung und Maintainer-Quelle dokumentiert.

Prüfungen erfolgreich: Prettier, ESLint, TypeScript, 82 Anwendungstests nach
dem Update, 53 native Tests und neun Release-Prüfertests. Eigenes Android-Lint
mit 0 Fehlern und 30 Warnungen. Alle drei Manifestvarianten, Expo-Kompatibilität
und 20 Doctor-Prüfungen erfolgreich. Store-Build einschließlich Release-Lint
ohne zusätzliche Task-Ausschlüsse erfolgreich.

Bundletool und Jarsigner bestätigen com.appfactory.series_log, SerienLog,
1.0.0 (1), Minimum API 24, Target 36, keine Debug-/Testflags und das eigene
Upload-Zertifikat. Netzwerk-, Mikrofon- und breite Medienrechte fehlen.
Alle 44 nativen ARM64-/x86_64-Bibliotheken besitzen passende 16-KB-Ladesegmente.
Das Bundle fordert PAGE_ALIGNMENT_16K. Die Source Map mit 2109 Quellen
enthält keines der fünf geprüften Build-Werkzeug-Pakete.

Auslieferung: build/releases/production/serienlog-1.0.0-build-1-production.aab.
SHA-256: d1231d69ea7cdef1ccb3a896a2af489219c9d3071c94a0c9ed4b51fac7fd7465.
JSON-Prüfdatei und deutsche Versionshinweise liegen daneben. Nachweise unter
build/validation/release-1/. Erneuten Build-Aufruf mit bestehender Auslieferung
abgelehnt und unveränderte Prüfsumme bestätigt. Ausgabeordner geöffnet.

Keine Smartphone-Installation, kein Push, kein Play-Upload und keine
Veröffentlichung. Dev-Daten und private Schlüssel bleiben unverändert.
