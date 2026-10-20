# Button-Rundungen an MaschinenLog angleichen

Die Buttonformen und Rahmen in SerienLog mit MaschinenLog verglichen.
Nur der gemeinsame Standardbutton wich bei der Rundung ab. Dessen Radius
von 12 auf 40 geändert. Das gilt unter anderem für „Serie speichern“,
„Änderungen speichern“ sowie gefüllte und umrandete Standardaktionen.
Farben, Zustände, Texte und Bedienung bleiben erhalten.

Dialogaktionen sind bereits identisch gerundet. Symbolbuttons, schwebender
Anlegen-Button sowie die Formen von Feldern und Auswahlflächen entsprechen
bereits ihrem jeweiligen Gegenstück. Dialoge, Passwortabfragen, Datum/Uhrzeit,
Ladeanzeige und von unten einblendende Panels besitzen bereits eine dezente
1-dp-Kontur in der SerienLog-Farbe overlayBorder. Diese vorhandenen Gestaltungen
auf ausdrücklichen Nutzerhinweis unverändert gelassen.

Manuelle Abnahmeschritte in docs/VALIDATION.md ergänzt. npm run check erfolgreich
mit Prettier, ESLint, TypeScript und allen 78 vorhandenen Tests. Keine zusätzlichen
Tests für den einzelnen Stilwert und keine aufwendige visuelle Testreihe.
Diff und Whitespace geprüft.

Das verbundene HONOR hat die eigenständige Dev-Preview für
com.appfactory.series_log.dev, Version 1.0.0, Code 1, ohne Debug-Flag.
Diese Installation bietet kein Fast Refresh. Die reine UI-Änderung löst keinen
APK-Neubau aus und ist auf dem Smartphone erst nach dem nächsten beauftragten
Dev-APK-Update sichtbar. Keine Geräteinstallation, kein Store-Build, keine
Versionsanhebung und kein Push. Nur SerienLog geändert und lokal committet.
