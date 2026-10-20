# Dev-Preview mit deutschen Genre-Vorschlägen installieren

Auf ausdrücklichen Wunsch eine neue eigenständige Dev-Preview vom Code-Stand
e0eeece gebaut. Sie enthält die sechs deutschen Genre-Vorschläge sowie die
bereits zuvor übernommenen Korrekturen für Erinnerungen.

npm run build:preview erfolgreich. APK-SHA-256:
df8c8411d7413ea375a02185ab5fb13b0c874a56b0bd4ae10882279f683d925a.

Auf dem angeschlossenen HONOR BVL-N49 vorab das geöffnete Formular geprüft.
Serientitel und Notiz waren leer, Genre auf Drama und Erinnerung ausgeschaltet.
Keine ungespeicherten Eingaben erkennbar.

Mit npm run install:preview -- A5CS024205005243 datenbewahrend aktualisiert.
Zielpaket com.appfactory.series_log.dev, Version 1.0.0, Code 1, ohne Debug-Flag.
Installer null und übereinstimmende Signaturen vor dem Update geprüft.
Die Installationshilfe prüft zusätzlich das eingebettete JavaScript und fehlende
Netzwerkberechtigungen. Installation über adb install -r -t -g --no-streaming
erfolgreich. Keine Deinstallation oder Datenlöschung. Die Erstinstallationszeit
blieb 12. Oktober 2026, 21:46:08. Neue Aktualisierungszeit 20. Oktober, 08:11:59.

App-Start ausgelöst und laufenden Prozess geprüft. Im kurzen prozessbezogenen
Logcheck keine Fehler unter AndroidRuntime, ReactNativeJS oder Expo beobachtet.
Danach war eine andere App im Vordergrund. Die Genre-Liste auf dem Gerät wurde
deshalb nicht zusätzlich visuell abgenommen.

Nur Installationsnachweis ergänzt. Formatierung und Whitespace geprüft.
Der unveränderte Code-Stand war zuvor mit npm run check und 78 Tests geprüft.
Kein Store-Build, kein Push und keine Änderungen an Nachbar-Apps.
