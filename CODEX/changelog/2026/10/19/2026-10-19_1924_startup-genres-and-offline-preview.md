# SerienLog-Start, Genre-Auswahl und Offline-Preview

Das eigene SerienLog-Icon erscheint jetzt auf dunklem Hintergrund. Die native
Startansicht und die React-Ladeansicht verwenden dasselbe Motiv. Die bestehende
Bereitschaftslogik wartet auf Schriftarten, Datenbank, Layout und erste Inhalte.
Danach erfolgt eine Überblendung von 180 Millisekunden ohne Mindestwartezeit.
Fehleransicht und Wiederholen bleiben erreichbar.

Genre-Vorschläge liegen in einer eigenen Ebene außerhalb des scrollenden
Formulars. Die Platzberechnung berücksichtigt Formulargrenzen, Tastatur,
Bildschirmgröße und Schriftgröße. Die Liste öffnet bei Bedarf oberhalb des
Feldes und scrollt unabhängig. Formularbewegungen aktualisieren ihre Position.
Eine dezente rote Kontur trennt die Liste vom Formular. Außenberührungen werden
abgefangen, während das Genre-Feld für Textkorrekturen erreichbar bleibt.
Android-Zurück schließt die Liste und gibt den Fokus für das nächste Öffnen frei.

Eigene Manifest-Overlays entfernen INTERNET und ACCESS_NETWORK_STATE aus Store
und Dev-Preview. Dev-Debug behält Metro-Zugriff. Das Expo-Plugin stellt beide
Overlays und die Startressourcen wieder her. Der Preview-Installer lehnt
Netzwerkrechte vor jedem Gerätezugriff ab. Die neue Manifest-Prüfung erzeugt
weder eine Store-APK noch eine AAB. Datenschutzerklärung und Entwicklungsanleitung
unterscheiden die Varianten. Veraltete Hinweise auf Gesamtfolgenzahlen und
Fortschrittsberechnung wurden in der Datenschutzerklärung korrigiert.

Kompatible SDK-57-Patches aus MaschinenLog übernommen. Expo steht auf 57.0.30.
shell-quote 1.12.0 und source-map-js 1.2.2 beseitigen zwei Audit-Ursachen.
React, React Native, Paketkennungen, Version und Datenformate bleiben erhalten.
Keine Änderungen an Nachbar-Apps und keine gemeinsame Bibliothek.

Prüfung: npm run check erfolgreich mit Formatierung, ESLint, TypeScript und
78 Tests. Nach der abschließenden Android-Zurück-Korrektur erneut TypeScript,
ESLint und alle neun Genre-Tests erfolgreich. Die native Prüfung besteht mit
44 JVM-Tests und Android-Lint ohne Fehler bei 30 Warnungen. Die bestehenden
Ausnahmen für zwei abstürzende Abhängigkeits-Linttasks bleiben unverändert.
Expo-Kompatibilitätsprüfung erfolgreich und Expo Doctor 1.21.5 mit 20 von 20
Prüfungen. Die fünf erzeugten Icon-Auflösungen passen vollständig in die
Android-Startbildmaske. Das ist keine visuelle Geräteabnahme.

Dev-Preview gebaut und nach der letzten UI-Korrektur inkrementell aktualisiert.
Die signierte APK enthält eingebettetes JavaScript, kein Debug-Flag und keine
Internet- oder Netzwerkstatusberechtigung. Paket com.appfactory.series_log.dev,
Version 1.0.0, Code 1, Architekturen arm64-v8a und x86_64. Auch nach erneutem
Prebuild stimmen die Manifest-Overlays. Die abschließende Manifest-Prüfung
bestätigt alle drei Varianten ohne Ausführung der Store-Bundle-Aufgabe.
Bash-Syntax und Diff/Whitespace geprüft. Keine Paketversion wurde herabgesetzt.

APK: android/app/build/outputs/apk/dev/release/app-dev-release.apk.
SHA-256: aefddd6e87c54bf8c90c1622e2396fcb79b9e407515dc340ee2b9e4259a2e4d2.

npm audit und npm audit --omit=dev melden weiterhin 18 hohe Paketeinträge aus
zwei Ursachen, node-forge und braces. Keine kritischen Meldungen. Beide Audits
enden mit Code 1. Die Einordnung steht in docs/DEPENDENCIES.md. Kein erzwungener
Downgrade, keine neuen Overrides und keine Audit-Unterdrückung.

Geräteabnahme: Während der Umsetzung war kein Android-Gerät über adb verbunden.
Keine Installation und keine Änderungen an Nutzerdaten. Reale Prüfung von
Kaltstart, Tastaturbedienung, externen Links und Teilen bleibt offen.
Kein Push, kein Store-APK-/AAB-Build und keine Veröffentlichung.
