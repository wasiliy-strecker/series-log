import type { EntryForm } from '../../core/domain/models';
import { wholeNumber, type Position } from '../../core/domain/episode-position';
import type { FormErrors } from '../../core/ui/use-form-errors';

export const entryFieldOrder = ['season', 'episode', 'occurredAt', 'note'];

export function validateEntryForm(form: EntryForm): {
  position: Position | null;
  errors: FormErrors;
} {
  const errors: FormErrors = {};
  let season: number | null = null;
  let episode: number | null = null;
  try {
    season = wholeNumber(form.season, 'Staffel');
  } catch {
    errors.season = 'Bitte eine ganze Staffelzahl größer als 0 eingeben.';
  }
  try {
    episode = wholeNumber(form.episode, 'Folge');
  } catch {
    errors.episode = 'Bitte eine ganze Folgenzahl größer als 0 eingeben.';
  }
  if (!form.occurredAt || !Number.isFinite(Date.parse(form.occurredAt)))
    errors.occurredAt = 'Bitte ein gültiges Datum und eine Uhrzeit auswählen.';
  if (form.note.length > 20000)
    errors.note = 'Die Notiz darf höchstens 20.000 Zeichen enthalten.';
  return {
    position: Object.keys(errors).length
      ? null
      : { season: season!, episode: episode! },
    errors,
  };
}

export function entrySaveFieldErrors(error: unknown): FormErrors | null {
  if (!(error instanceof Error)) return null;
  if (error.message.startsWith('Staffel:')) return { season: error.message };
  if (error.message.startsWith('Folge:')) return { episode: error.message };
  return null;
}
