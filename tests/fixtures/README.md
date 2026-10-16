# Synthetische Backup-Fixture

`backup-v1.bin` wurde vor der Umstellung auf native SHA-/AES-Funktionen mit dem
SerienLog-Backup-Code aus Commit `4ba4a68` erzeugt. Die Datei bleibt als fester
Kompatibilitätsfall erhalten und wird in Tests nicht neu erzeugt.

Das absichtlich öffentliche Testpasswort lautet `Synthetic SerienLog ä🔑`.
Es schützt ausschließlich synthetische Testdaten. `backup-v1.json` beschreibt
die erwarteten Daten. Enthalten sind zwei Folgenstände, eine Erinnerung, ein
früheres und ein aktuelles Foto sowie ein mehrfach referenziertes Test-PDF.
Die Bilder basieren auf der bereits vorhandenen synthetischen `photo.jpg`.
Es gibt keine echten Nutzerdaten oder privaten Dokumente.
