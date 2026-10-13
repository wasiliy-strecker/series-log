# Feldfehler beim Speichern sichtbar machen

Beim Speichern von Serien und Folgenständen erscheinen fehlende oder ungültige
Angaben direkt unter dem betroffenen Eingabefeld. Das Formular scrollt zum
obersten Fehler. Wiederholtes Speichern springt erneut dorthin. Korrigierte
Felder verlieren ihren Fehlhinweis sofort.

Die Prüfung deckt Pflichtfelder, ganze Staffel- und Folgenzahlen, Datum,
Notizlänge sowie Konflikte mit bekannten Staffel- und Gesamtfolgenzahlen ab.
Auch Fehler durch bereits gespeicherte Folgenstände werden dem passenden Feld
zugeordnet. Der Staffelwechsel nutzt dieselben Feldhinweise.

`npm run check` mit 20 Tests bestanden. Die eigenständige Dev-Testversion wurde
gebaut und nach Kennungs- und Signaturprüfung datenbewahrend auf dem verbundenen
Android-Gerät installiert. Die App startete und der vorhandene Formularentwurf
blieb sichtbar. Ein manueller Speicherversuch mit leerer Folge zeigte den
Fehler direkt unter der Eingabe und scrollte vom Formularende zu ihr.
