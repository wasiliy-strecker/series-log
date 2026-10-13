import type { SeriesRecord } from '../../core/domain/models';
import { validateProgress, wholeNumber } from '../../core/domain/progress';
import type { FormErrors } from '../../core/ui/use-form-errors';

export const recordFieldOrder = [
  'category',
  'name',
  'totalEpisodes',
  ...Array.from({ length: 200 }, (_, index) => `season-${index}`),
  'note',
];

export function validateRecordForm(
  record: SeriesRecord,
  totalInput: string,
  seasonInputs: string[],
): { value: SeriesRecord | null; errors: FormErrors } {
  const errors: FormErrors = {};
  if (!record.category.trim()) errors.category = 'Bitte ein Genre eingeben.';
  if (!record.name.trim()) errors.name = 'Bitte einen Serientitel eingeben.';
  if (record.category.length > 500)
    errors.category = 'Das Genre darf höchstens 500 Zeichen enthalten.';
  if (record.name.length > 500)
    errors.name = 'Der Serientitel darf höchstens 500 Zeichen enthalten.';
  if (record.note.length > 20000)
    errors.note = 'Die Notiz darf höchstens 20.000 Zeichen enthalten.';

  let totalEpisodes: number | null = null;
  if (totalInput.trim()) {
    try {
      totalEpisodes = wholeNumber(totalInput, 'Gesamtfolgenzahl', 1);
    } catch {
      errors.totalEpisodes =
        'Bitte eine ganze Zahl zwischen 1 und 1.000.000 eingeben.';
    }
  }
  const seasons = seasonInputs.map((input, index) => {
    if (!input.trim()) return null;
    try {
      return wholeNumber(input, `Staffel ${index + 1}`, 1);
    } catch {
      errors[`season-${index}`] =
        'Bitte eine ganze Zahl zwischen 1 und 1.000.000 eingeben.';
      return null;
    }
  });
  if (Object.keys(errors).length) return { value: null, errors };

  const value = { ...record, totalEpisodes, seasons };
  try {
    validateProgress(value, []);
  } catch (error) {
    errors.totalEpisodes = (error as Error).message;
  }
  return { value: Object.keys(errors).length ? null : value, errors };
}

export function recordSaveFieldErrors(error: unknown): FormErrors | null {
  if (!(error instanceof Error)) return null;
  const season = /^Staffel (\d+) hat /.exec(error.message);
  if (season) return { [`season-${Number(season[1]) - 1}`]: error.message };
  if (
    error.message.includes('Gesamtfolgenzahl') ||
    error.message.startsWith('Der Folgenstand überschreitet')
  )
    return { totalEpisodes: error.message };
  return null;
}
