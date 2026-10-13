# Speicherbestätigung eindeutig beschriften

Der Smartphone-Screenshot zeigte beim Speichern eines niedrigeren Folgenstands
einen Bestätigungsdialog mit dem Button „Löschen“. Die gemeinsame Dialogfunktion
hatte „Löschen“ als Standardaktion verwendet, obwohl dieser Button hier den
Folgenstand gespeichert hätte.

Jede Bestätigung verlangt jetzt eine ausdrücklich benannte Aktion. Speicher- und
Staffelwechsel-Dialoge verwenden passende, nicht destruktive Buttons.
Löschdialoge behalten ausdrücklich „Löschen“. Beim niedrigeren Folgenstand zeigt
die Rückfrage den bisherigen und den neuen Stand und bietet „Trotzdem speichern“
oder „Eingabe prüfen“. Rückdatierte historische Einträge lösen diese Warnung nur
dann aus, wenn sie die Übersicht beeinflussen können.

`npm run check` mit 21 Tests und der Dev-Testbuild bestanden. Die APK wurde nach
Kennungs- und Signaturprüfung datenbewahrend auf dem verbundenen Smartphone
installiert, ohne die im Vordergrund geöffnete andere App zu wechseln.
