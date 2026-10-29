# Alte Release-Prüfstände und doppelte Gesamt-ZIPs entfernt

Auf ausdrücklichen Nutzerauftrag die zuvor geprüften alten Kandidaten und
Prüfstände von ModellbauLog, MaschinenLog, AquariumLog und SerienLog entfernt.
Zusätzlich ausschließlich die vier bestätigten Gesamt-ZIPs gelöscht.

| Bereich | Freigegebene Bytes |
|---|---:|
| ModellbauLog, verworfene Releases und localization-work | 1.036.910.592 |
| MaschinenLog, ältere Release-Kandidaten | 585.314.304 |
| AquariumLog, ältere Release-Kandidaten | 486.330.368 |
| SerienLog, zwei ältere internationale Prüfstände | 436.531.200 |
| Vier Gesamt-ZIPs | 414.003.200 |
| Zusammen | 2.959.089.664 |

Vor dem Löschen alle 506 ZIP-Dateiinhalte per SHA-256 gegen ihre weiterhin
vorhandenen Dateien verglichen. Alle 24 Demo-Sicherungskopien in den alten
Kandidaten haben bytegleiche erhaltene Gegenstücke in den finalen Lieferungen.
Keine versionierten Dateien oder offenen Zugriffe in den Löschzielen gefunden.
Verknüpfungen wurden nicht verfolgt. Kein erhaltener Link benötigte ein Löschziel.

Metadaten beziehungsweise Symlink-Ziele von 187.468 geschützten Dateien und
SHA-256-Werte von 4.730 wichtigen Dateien vor und nach der Bereinigung verglichen.
Keine Abweichungen. Die ursprünglichen Git-Arbeitsstände blieben unverändert.

Aktuelle APKs/AABs, produktive Mappings, einzelne Sprach-ZIPs, finale Store-Bilder,
Übersetzungen, Quellcode und Schlüssel bleiben erhalten. Hausakte, andere Apps,
zentrale Caches und Geräte wurden nicht verändert. Keine Prozesse beendet.

Nach Abschluss waren etwa 10,28 GB frei. Die Inode-Bilanz berücksichtigt
Hardlinks. Laufende andere Arbeiten und das lokale Prüfprotokoll beeinflussen
die Nettoänderung des freien Speicherplatzes.

Nur diese Dokumentation wird lokal versioniert. Inhalt und Git-Whitespace werden
geprüft. Keine Codeänderungen, Tests, Neubauten oder Pushes erforderlich.
