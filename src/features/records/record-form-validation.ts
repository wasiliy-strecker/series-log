import type { SeriesRecord } from '../../core/domain/models';
import type { FormErrors } from '../../core/ui/use-form-errors';

export const recordFieldOrder = ['category', 'name', 'note'];

export function validateRecordForm(record: SeriesRecord): {
  value: SeriesRecord | null;
  errors: FormErrors;
} {
  const errors: FormErrors = {};
  if (!record.category.trim()) errors.category = 'Bitte ein Genre eingeben.';
  if (!record.name.trim()) errors.name = 'Bitte einen Serientitel eingeben.';
  if (record.category.length > 500)
    errors.category = 'Das Genre darf höchstens 500 Zeichen enthalten.';
  if (record.name.length > 500)
    errors.name = 'Der Serientitel darf höchstens 500 Zeichen enthalten.';
  if (record.note.length > 20000)
    errors.note = 'Die Notiz darf höchstens 20.000 Zeichen enthalten.';
  return { value: Object.keys(errors).length ? null : record, errors };
}
