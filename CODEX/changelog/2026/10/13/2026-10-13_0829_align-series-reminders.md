# Weiterschauen-Erinnerungen an MaschinenLog angeglichen

Das Erinnerungsformular und die Statusanzeigen folgen der MaschinenLog-Umsetzung
des ZählerstandLog-Ablaufs. Standardwerte, stündlicher Start mit Datum und Uhrzeit,
Intervallwechsel, gespeicherte Monatstage und die Hinweise zu Android-Freigaben
wurden für SerienLog übernommen.

Testmeldungen zeigen Serientitel, Genre und letzten Folgenstand. Android öffnet
beim Antippen die zugehörige Serie. Blockierte Kategorien, „Nicht stören“,
fehlende Alarmfreigabe und fehlgeschlagene Planung haben eigene Meldungen und
passende Einstellungsziele. Fehler beim Ausschalten bleiben sichtbar und können
erneut bearbeitet werden. Die vorhandenen Benachrichtigungskanal-IDs bleiben
erhalten. SQLite- und Backupformat bleiben unverändert.

`npm run check` mit 17 Tests und `npm run check:native` mit 44 JVM-Tests samt
Android-Lint bestanden. Eine eigenständige Dev-Testversion wurde erfolgreich
gebaut. Der manuelle Geräteablauf ist in `docs/VALIDATION.md` beschrieben.
