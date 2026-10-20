# Sechs deutsche Genre-Vorschläge

Den letzten gespeicherten SerienLog-Screenshot vom angeschlossenen Smartphone
geprüft. Die bisherige lange Liste durch genau sechs deutsche Vorschläge
ersetzt: Drama, Komödie, Krimi, Abenteuer, Zeichentrick und Dokumentation.
Auch der Platzhalter verwendet Komödie statt Comedy.

Genre-Bezeichnungen, Feldtitel, Platzhalter und Hilfetext liegen jetzt im
deutschen Sprachkatalog src/core/i18n/de.ts mit stabilen Schlüsseln und einem
zentralen Zugriff. Weitere Übersetzungen können dort später ergänzt werden.
Die App-Sprache bleibt Deutsch. Keine neue Abhängigkeit und keine umfassende
Sprachumschaltung für die übrigen App-Bereiche eingeführt.

Die sechs Vorschläge werden nicht mehr mit gespeicherten Genres erweitert.
Dadurch tauchen frühere englische Begriffe nicht erneut als zusätzliche
Vorschläge auf. Vorhandene Serien und frei eingegebene Genres bleiben erhalten
und bearbeitbar. Keine Datenmigration oder Änderungen am Backup-Format.

Die vorhandenen Vorschlagsfeld-Tests verwenden jetzt dieselbe deutsche Liste
wie die App. Auswahl von Komödie, Filterung, freie Eingaben und das Verhalten
mit Tastatur bleiben geprüft. Manuelle Abnahmeschritte ergänzt.
npm run check erfolgreich mit Formatprüfung, ESLint, TypeScript und 78 Tests.

Nur TypeScript- und Textänderungen. Kein APK-Neubau. Die installierte
eigenständige Dev-Preview bietet kein Fast Refresh und zeigt weiterhin den
bisherigen Stand bis zum nächsten ausdrücklich beauftragten APK-Update.
Keine Änderungen an Nachbar-Apps, kein Store-Build und kein Push.
