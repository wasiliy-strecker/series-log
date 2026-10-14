# Konflikte mit Folgenzahlen verständlich erklären und direkt lösen

Der letzte SerienLog-Screenshot zeigte Folge 59 bei einer hinterlegten Gesamtzahl von 26 Folgen. Die Prüfung bleibt bestehen. Die Fehlermeldungen nennen jetzt die konkrete Gesamt- oder Staffelgrenze und den eingegebenen Stand. Bei unbekannten früheren Staffellängen wird eine Untergrenze ausdrücklich als „mindestens“ beschrieben.

Die Erfassung zeigt die bekannten Folgenzahlen direkt bei der Eingabe. „Folgenzahlen anpassen“ sichert den aktuellen Entwurf und öffnet die Serienbearbeitung bei den Folgenangaben. Nach dem Speichern kehrt die App zur laufenden Erfassung zurück und lädt die neuen Seriengrenzen. Staffel, Folge, Notiz und Anhänge des Entwurfs werden dabei nicht zurückgesetzt. Die Gesamtzahl wird nicht automatisch erhöht.

`npm run check` mit Formatierung, ESLint, TypeScript und 23 Tests erfolgreich. Neue gezielte Tests prüfen den Konflikt 59 zu 26, bewusst erhöhte oder offene Grenzen und den erhaltenen Entwurf bis zum späteren erfolgreichen Speichern. Der vorhandene Test für unbekannte Staffellängen prüft die tatsächliche Untergrenze in der Meldung.

`npm run build:preview` erfolgreich. Nach Prüfung von Paket, Version, Debug-Flag, Installer und übereinstimmender Signatur datenbewahrend auf dem verbundenen HONOR BVL-N49 installiert. Paket `com.appfactory.series_log.dev`, Version 1.0.0, Code 1, nicht debuggable, Installer `null`. Start angefordert und kein Absturz im kurzen Logcheck. Das Smartphone war anschließend gesperrt. Der Bildschirmtest für den Wechsel zu den Folgenangaben und zurück bleibt als Schritt 14 in `docs/VALIDATION.md` dokumentiert.

Kein Store-Build und kein Push.
