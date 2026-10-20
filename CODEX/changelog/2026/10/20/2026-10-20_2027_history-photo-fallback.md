# Vorhandenes Verlaufsfoto für Serienprotokolle verwenden

Der Smartphone-Screenshot von 20:19 zeigt die deaktivierte Option
„Mit aktuellem Foto“. Die bisherige Verfügbarkeitsabfrage und PDF-Auswahl
berücksichtigten nur den allerneuesten Folgenstand. Ein neuerer Eintrag ohne
Foto verdrängte damit vorhandene Fotos aus dem Serienprotokoll.

Die Freigabe berücksichtigt jetzt alle gespeicherten Folgenstände derselben
Serie, unabhängig von Suche und aktueller Verlaufsseite. Die PDF verwendet
genau das erste Foto des zeitlich neuesten Folgenstands mit Foto. Neuere
Einträge ohne Foto bleiben im Verlauf erhalten. Rückdatierte Einträge
überschreiben die Auswahl nicht allein durch ihren späteren Speicherzeitpunkt.
Einzelprotokolle bleiben auf den ausgewählten Folgenstand begrenzt.
Entwürfe und andere Serien liefern kein Foto. Gespeicherte PDFs, Originalfotos
und Backups bleiben unverändert.

Die angepassten Auswahl- und Hilfetexte stehen zentral unter stabilen
Übersetzungsschlüsseln. README und manuelle Prüfschritte beschreiben die
korrigierte Auswahl.

`npm run check` erfolgreich mit Prettier, ESLint, TypeScript und 82 Tests.
Der gezielte React-Test prüft den Erstellen-Ablauf mit aktivierter Foto-Option,
echtem SQLite-Repository und PDF-Erzeugung, obwohl der neueste Folgenstand
kein Foto hat. PDF-Tests prüfen die tatsächlich eingebetteten Bilddaten,
zeitliche Auswahl, gefilterte Verlaufsseiten, Einzelprotokolle, kompakte Ausgabe,
unveränderte Einträge und die Abgrenzung zu Entwürfen und anderen Serien.
Vorhandene PDF-Dokumente ermöglichen weiterhin die vollständige Ausgabe.

`npm run build:preview` erfolgreich. Für die bereits beauftragte eigenständige
Geräteversion musste der eingebettete App-Code neu gebaut werden.
`npm run install:preview -- A5CS024205005243` hat Kennung, Version, Debug-Flag,
Installer und Signatur geprüft und um 20:27 datenbewahrend installiert.
Ziel ist `com.appfactory.series_log.dev`, Version 1.0.0, Code 1,
nicht debuggable, Installer null. Die Signaturen stimmen überein.
Der Prozessstart ist bestätigt. Im kurzen Prozesslog erscheinen keine
JavaScript- oder Android-Abstürze.

Das Smartphone ist nach der Installation weiterhin gesperrt. Das Entsperren
wurde angefragt. Die direkte Geräteprüfung bleibt deshalb offen. Auf dem
Nutzergerät wurde kein weiteres Protokoll erzeugt und kein Foto verändert.

APK-SHA-256: `02443dd2a1a83fa5ddf3046d43bec22c0f03c901747bb78e1fbdf73206d60924`.
Kein Store-Build und kein Push. Referenz-Apps bleiben unverändert.
