import type {
  EntryForm,
  EpisodeEntry,
  SeriesRecord,
} from '../../core/domain/models';
import {
  validateProgress,
  wholeNumber,
  type Position,
} from '../../core/domain/progress';
import type { FormErrors } from '../../core/ui/use-form-errors';

export const entryFieldOrder = ['season', 'episode', 'occurredAt', 'note'];

export function needsLowerPositionConfirmation(
  position: Position,
  occurredAt: string,
  latest?: EpisodeEntry,
): boolean {
  if (!latest) return false;
  const lower =
    position.season < latest.season ||
    (position.season === latest.season && position.episode < latest.episode);
  return (
    lower &&
    new Date(occurredAt).getTime() >= new Date(latest.occurredAt).getTime()
  );
}

export function validateEntryForm(
  form: EntryForm,
  record: SeriesRecord | undefined,
  completedSeason = false,
): { position: Position | null; errors: FormErrors } {
  const errors: FormErrors = {};
  let season: number | null = null;
  let episode: number | null = null;
  try {
    season = wholeNumber(form.season, 'Staffel', 1, 200);
  } catch {
    errors.season = 'Bitte eine ganze Staffelzahl zwischen 1 und 200 eingeben.';
  }
  try {
    episode = wholeNumber(form.episode, 'Folge');
  } catch {
    errors.episode =
      'Bitte eine ganze Folgenzahl zwischen 0 und 1.000.000 eingeben.';
  }
  if (!form.occurredAt || !Number.isFinite(Date.parse(form.occurredAt)))
    errors.occurredAt = 'Bitte ein gültiges Datum und eine Uhrzeit auswählen.';
  if (form.note.length > 20000)
    errors.note = 'Die Notiz darf höchstens 20.000 Zeichen enthalten.';
  if (season === null || episode === null) return { position: null, errors };
  const position = { season, episode };
  if (record && !completedSeason) {
    try {
      validateProgress(record, [position]);
    } catch (error) {
      errors.episode = (error as Error).message;
    }
  }
  return { position: Object.keys(errors).length ? null : position, errors };
}

export function entrySaveFieldErrors(error: unknown): FormErrors | null {
  if (!(error instanceof Error)) return null;
  if (
    /^Staffel \d+ hat /.test(error.message) ||
    error.message.startsWith('Der Folgenstand überschreitet')
  )
    return { episode: error.message };
  return null;
}
