# Vereinfachte SerienLog-Version auf dem Smartphone installieren

Auf ausdrücklichen Wunsch die aktuelle eigenständige SerienLog-Dev-Vorschau neu gebaut und auf dem angeschlossenen HONOR BVL_N49 installiert. Der Stand enthält die vereinfachten Serienangaben ohne separate Staffelverwaltung aus Commit `b94f7b2`. Staffel und Folge werden weiterhin beim Folgenstand gespeichert.

`npm run build:preview` erfolgreich. Das Installationsskript prüfte vor dem Update das Zielpaket `com.appfactory.series_log.dev`, Version `1.0.0` mit Versionscode `1`, fehlendes Debug-Flag und Installer `null`. Das SHA-256-Signaturzertifikat stimmt mit der vorhandenen Installation überein. `npm run install:preview -- A5CS024205005243` installierte mit `adb install -r -t -g --no-streaming` erfolgreich und startete die App. Keine Datenlöschung, keine Änderung der App-Kennung und kein Store-Build.

Der App-Prozess läuft und React Native meldet den Start von `main`. Im Prozessprotokoll kein App-Absturz und kein JavaScript-Fehler erkennbar. Das Gerät blieb gesperrt, deshalb keine visuelle Formularprüfung auf dem Smartphone durchgeführt. Manuell nach dem Entsperren SerienLog Dev öffnen, eine Serie bearbeiten und prüfen, dass keine separate Staffelliste mehr angezeigt wird. Die vorhandenen Prüfschritte stehen in `docs/VALIDATION.md`.

Die unveränderten Quellen wurden unmittelbar vor diesem Geräteauftrag mit `npm run check` einschließlich 25 Tests erfolgreich geprüft. Für diesen Build keine erneute Testsuite ausgeführt. Die von Expo erzeugte reine Leerzeichenänderung in `android/settings.gradle` entfernt. Changelog-Formatierung und Git-Whitespace-Prüfung erfolgreich. APK-Ausgabe und lokale Schlüssel nicht eingecheckt. Kein Push.
