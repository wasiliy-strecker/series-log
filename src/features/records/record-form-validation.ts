import { t } from '../../core/i18n/runtime';
import type { SeriesRecord } from '../../core/domain/models';
import type { FormErrors } from '../../core/ui/use-form-errors';
export const recordFieldOrder = ['category', 'name', 'note'];
export function validateRecordForm(record: SeriesRecord): {
  value: SeriesRecord | null;
  errors: FormErrors;
} {
  const errors: FormErrors = {};
  if (!record.category.trim()) errors.category = t('Bitte ein Genre eingeben.');
  if (!record.name.trim()) errors.name = t('Bitte einen Serientitel eingeben.');
  if (record.category.length > 500)
    errors.category = t('Das Genre darf höchstens 500 Zeichen enthalten.');
  if (record.name.length > 500)
    errors.name = t('Der Serientitel darf höchstens 500 Zeichen enthalten.');
  if (record.note.length > 20000)
    errors.note = t('Die Notiz darf höchstens 20.000 Zeichen enthalten.');
  return { value: Object.keys(errors).length ? null : record, errors };
}
