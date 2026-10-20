export const de = {
  genres: {
    drama: 'Drama',
    comedy: 'Komödie',
    crime: 'Krimi',
    adventure: 'Abenteuer',
    cartoon: 'Zeichentrick',
    documentary: 'Dokumentation',
  },
  genreField: {
    label: 'Genre *',
    placeholder: 'z. B. Drama oder Komödie',
    helper: 'Vorschlag auswählen oder eigenes Genre eingeben.',
  },
  photoActions: {
    title: 'Foto {number} bearbeiten',
    replace: 'Foto ersetzen',
    replaceHint: 'Neues Foto aufnehmen oder aus der Galerie wählen.',
    remove: 'Foto entfernen',
    removeHint: 'Aus diesem Folgenstand entfernen.',
    earlier: 'Nach vorne',
    later: 'Nach hinten',
    camera: 'Neu fotografieren',
    gallery: 'Aus Galerie wählen',
  },
  reportContent: {
    title: 'PDF-Inhalt wählen',
    helper: 'Wähle, welche Inhalte deine PDF enthalten soll.',
    compact: 'Kompakt ohne Anhänge',
    compactHint: 'Staffel, Folge, Datum und Notizen ohne eingebettete Fotos.',
    withPhoto: 'Mit aktuellem Foto',
    singlePhotoHint:
      'Enthält das erste Foto dieses Folgenstands und vorhandene PDF-Dokumente.',
    historyPhotoHint:
      'Enthält das erste Foto des neuesten Folgenstands mit Foto und vorhandene PDF-Dokumente. Neuere Stände ohne Foto bleiben im Verlauf enthalten.',
    noAttachments: 'Kein Foto oder PDF-Dokument vorhanden.',
    singleSummary:
      'Du wählst vor dem Erstellen: kompakt ohne Anhänge oder mit dem ersten Foto dieses Folgenstands. Eintrag, Zeitpunkt und Notizen sind in beiden Varianten enthalten – zum Speichern, Drucken oder Teilen.',
    historySummary:
      'Die PDF bündelt alle Folgenstände und Notizen der Serie. Auf Wunsch ergänzt sie das erste Foto des neuesten Folgenstands mit Foto. Spätere Stände ohne Foto ändern diese Auswahl nicht – zum Speichern, Drucken oder Teilen.',
  },
} as const;
