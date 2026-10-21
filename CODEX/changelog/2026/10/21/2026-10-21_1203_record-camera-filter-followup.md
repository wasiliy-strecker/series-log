# 2026-10-21 12:03 - Record the deferred camera-filter improvement

## Task

Den Kamera-Gerätefilter für spätere Fragen nach fehlenden App-Verbesserungen merken.

## Status

Dokumentation abgeschlossen. Technische Verbesserung bleibt offen.

## Context

SerienLog und MaschinenLog deklarieren die Kameraberechtigung ohne optionale
Rückkamera-/Autofokus-Angaben. Die tatsächliche betroffene Reichweite ist unbekannt.

## Changes

Workspace-Merkliste `CODEX/OPEN_ITEMS.md` angelegt und in den Root-AGENTS.md
für künftige Bestandsaufnahmen verlinkt. SerienLog-Release-Anleitung ergänzt.

## Decisions

Für ein reguläres Update vorgemerkt. Der Punkt allein verzögert den aktuellen
Launch nicht. Kein pauschaler Änderungsauftrag für veröffentlichte Flutter-Apps.

## Verification

Dokumentation und Diff geprüft. Nur Dokumentationsänderungen, keine Tests,
Builds, Geräteaktionen oder Änderungen an Referenz-Apps erforderlich.

## Notes

Kein Push. Der Workspace besitzt kein Git-Repository. Die SerienLog-Dokumentation
und dieser Changelog werden lokal im App-Repository versioniert.
