# Alarmeinstellungen direkt aus der Erinnerung öffnen

Die beiden Smartphone-Screenshots zeigen, dass ZählerLog den Button
„Alarme & Erinnerungen“ auch bei normaler Erinnerung anbietet. SerienLog
zeigte bislang nur bei fehlender Freigabe für „Pünktlich mit Ton“ einen
Einstellungszugang. SerienLog zeigt den direkten Button jetzt bei jeder aktiven
Erinnerung auf Android 12 und neuer und nutzt die bereits vorhandene native
Einstellungsfunktion.

Die Fehlermeldung beim manuellen Öffnen ist unabhängig von der gewählten
Erinnerungsart. Beim Wechsel zu „Pünktlich mit Ton“ bleibt der Hinweis auf die
weiterhin ausgewählte Art erhalten. Der kurze Geräteprüfschritt steht in
`docs/VALIDATION.md`.

`npm run check` mit 21 Tests und der eigenständige Dev-Testbuild bestanden.
Die APK wurde nach Kennungs- und Signaturprüfung datenbewahrend auf dem
verbundenen Android-Gerät installiert. Ein Bytevergleich bestätigte die
installierte APK. Das gesperrte Gerät wurde für die Installation nicht geöffnet.
