# SerienLog-Preview mit runden Buttons installieren

Auf ausdrücklichen Nutzerauftrag den bereits geprüften Code-Stand `e3115ff`
als eigenständige Dev-Preview gebaut und auf dem HONOR installiert. Die beiden
Screenshots zeigten die ältere Installation von 08:11. Die Buttonänderung von
08:26 war darin noch nicht enthalten. Keine weitere Änderung der Buttonlogik.

`npm run build:preview` erfolgreich. `npm run install:preview -- A5CS024205005243`
prüft Kennung, fehlendes Debug-Flag, eingebettetes JavaScript, fehlende
Netzwerkberechtigungen und die Signatur gegen die vorhandene APK.
Signatur identisch. Installation mit `adb install -r -t -g --no-streaming`
erfolgreich. Paket `com.appfactory.series_log.dev`, Version 1.0.0 (1),
Installer null. Erstinstallation weiterhin 12. Oktober, 21:46:08.
Aktualisierung jetzt 20. Oktober, 19:07:47. Keine Deinstallation oder Datenlöschung.

APK: `android/app/build/outputs/apk/dev/release/app-dev-release.apk`.
SHA-256: `9b31d286300b2a6ab7d82c6257f6c29561ad05988190640f2185912b500d91e3`.

Start erfolgreich. Beide vorhandenen Serien und der gespeicherte Entwurf sind
weiterhin sichtbar. Die Detailansicht geöffnet und einen aktuellen Screenshot
geprüft. Bearbeiten, Löschen und die gefüllte Erstellen-Aktion sind nun deutlich
pillenförmig. Keine Daten bearbeitet, gelöscht oder neu gespeichert.
Kurzer Prozesslog ohne JavaScript- oder Android-Absturz. Keine aufwendige
visuelle Testreihe. Die bereits für `e3115ff` bestandenen 78 Tests wurden für
den unveränderten Code nicht erneut ausgeführt.

Nur vom Prebuild erzeugte Leerraumänderung in `android/settings.gradle`
zurückgenommen. Changelog und Geräteabnahme ergänzt. ModellbauLog und
MaschinenLog nicht verändert. Kein Store-Build, Versionssprung oder Push.
