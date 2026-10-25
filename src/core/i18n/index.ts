import { t } from './runtime';
export const messages = {
  genres: {
    get drama() {
      return t('Drama');
    },
    get comedy() {
      return t('Komödie');
    },
    get crime() {
      return t('Krimi');
    },
    get adventure() {
      return t('Abenteuer');
    },
    get cartoon() {
      return t('Zeichentrick');
    },
    get documentary() {
      return t('Dokumentation');
    },
  },
  genreField: {
    get label() {
      return t('Genre *');
    },
    get placeholder() {
      return t('z. B. Drama oder Komödie');
    },
    get helper() {
      return t('Vorschlag auswählen oder eigenes Genre eingeben.');
    },
  },
  photoActions: {
    get title() {
      return t('Foto {number} bearbeiten', { number: '{number}' });
    },
    get replace() {
      return t('Foto ersetzen');
    },
    get replaceHint() {
      return t('Neues Foto aufnehmen oder aus der Galerie wählen.');
    },
    get remove() {
      return t('Foto entfernen');
    },
    get removeHint() {
      return t('Aus diesem Folgenstand entfernen.');
    },
    get earlier() {
      return t('Nach vorne');
    },
    get later() {
      return t('Nach hinten');
    },
    get camera() {
      return t('Neu fotografieren');
    },
    get gallery() {
      return t('Aus Galerie wählen');
    },
  },
  reportContent: {
    get title() {
      return t('PDF erstellen');
    },
    get compact() {
      return t('PDF ohne Foto erstellen');
    },
    get withPhoto() {
      return t('PDF mit Foto erstellen');
    },
    get withoutPhotoLabel() {
      return t('Ohne Foto');
    },
    get withPhotoLabel() {
      return t('Mit Foto');
    },
    get noAttachments() {
      return t('Kein Foto vorhanden.');
    },
    get singleTitle() {
      return t('PDF zum Folgenstand');
    },
    get historyTitle() {
      return t('PDF zur Serie');
    },
  },
} as const;
