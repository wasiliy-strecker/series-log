import { latinDigits } from '../i18n/numbers';
import { localization } from '../i18n/runtime';
export function localDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}
export function parseDateInput(
  value: string,
  first: Date,
  last: Date,
): Date | null {
  const parts = new Intl.DateTimeFormat(localization().formatLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(2006, 10, 22));
  const fields = parts
    .filter((p) => ['day', 'month', 'year'].includes(p.type))
    .map((p) => p.type);
  const digits = latinDigits(value)
    .trim()
    .split(/[^0-9]+/)
    .filter(Boolean);
  if (digits.length !== 3) return null;
  const values = Object.fromEntries(
    fields.map((field, index) => [field, Number(digits[index])]),
  );
  const day = values.day,
    month = (values.month ?? 0) - 1,
    year = values.year;
  if (!day || !year || digits[fields.indexOf('year')]?.length !== 4)
    return null;
  const result = new Date(year, month, day);
  return result.getDate() === day &&
    result.getMonth() === month &&
    result.getFullYear() === year &&
    result >= first &&
    result <= last
    ? result
    : null;
}
export function calendarCells(month: Date): (number | null)[] {
  const start =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, i) =>
    i >= start && i < start + days ? i - start + 1 : null,
  );
}
