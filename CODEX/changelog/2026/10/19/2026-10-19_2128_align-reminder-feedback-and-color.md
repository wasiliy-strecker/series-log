# Erinnerungen an MaschinenLog angleichen

Die Fehlerbehandlung beim Wechsel zwischen „Normal“ und „Pünktlich mit Ton“
entspricht jetzt exakt der veröffentlichten MaschinenLog-Version aus Commit
44078f4. Ein unerwarteter Fehler bei „Normal“ zeigt den passenden Statushinweis
statt einer Meldung über die Alarmfreigabe. Auswahl und Freigabe der Bedienung
bleiben erhalten.

Reguläre und Test-Benachrichtigungen verwenden SerienLog-Rot #E50914 und direkt
das SerienLog-Symbol. Überflüssige Abzweigungen für frühere Zählerkategorien
entfernt. Terminberechnung, Kanäle, Alarmkennungen und gespeicherte Erinnerungen
bleiben unverändert. Der Einstellungsbutton für „Alarme & Erinnerungen“ bleibt
auf Android 12 und neuer beschränkt.

Die nativen Quellen liegen im app-eigenen Expo-Modul und werden durch Prebuild
nicht erzeugt. Deshalb ist keine zusätzliche Plugin-Anpassung erforderlich.
Gezielte manuelle Prüfschritte für Farbe und beide Fehlerfälle in VALIDATION.md
ergänzt.

Prüfung: npm run check erfolgreich mit Formatprüfung, ESLint, TypeScript und
78 Tests. npm run check:native erfolgreich mit 44 JVM-Tests und Android-Lint.
Android-Lint meldet 0 Fehler und die bestehenden 30 Warnungen. Die Methode zum
Wechsel der Erinnerungsart zusätzlich direkt mit MaschinenLog 44078f4 verglichen.

Wegen der geänderten nativen Benachrichtigungsdarstellung eine neue Dev-Preview
mit npm run build:preview gebaut und auf dem angeschlossenen HONOR BVL-N49
installiert. Vor dem Update Zielpaket com.appfactory.series_log.dev, Version
1.0.0 mit Code 1, fehlendes Debug-Flag, Installer null und übereinstimmende
Signatur geprüft. Die app-eigene Installationshilfe verwendet adb install -r
-t -g --no-streaming. Installation und App-Start erfolgreich, keine
Deinstallation oder Datenlöschung. Die Erstinstallationszeit blieb unverändert.
Im kurzen prozessbezogenen Start-Logcheck keine Fehler unter AndroidRuntime,
ReactNativeJS oder Expo beobachtet. Das Display blieb gesperrt. Eine sichtbare
Prüfung der Benachrichtigungsfarbe und reale Terminzustellung wurde nicht
durchgeführt.

APK-SHA-256: e56f1f542babe3739eecd3f0ff80b946c434c71aeff77ae105c8821cf48ed964.

Keine Änderungen an MaschinenLog oder anderen Vorlagen. Kein Store-Build und
kein Push.
