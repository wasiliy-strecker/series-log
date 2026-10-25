import { localization } from './runtime';

export function latinDigits(
  text: string,
  locale = localization().formatLocale,
) {
  const format = new Intl.NumberFormat(locale, { useGrouping: false });
  let result = text;
  for (let digit = 0; digit < 10; digit++)
    result = result.replaceAll(format.format(digit), String(digit));
  return result.replace(/[\u200e\u200f\u061c]/g, '');
}

/** Accept plain digits and valid regional grouping, never decimals or exponents. */
export function positiveInteger(
  text: string,
  locale = localization().formatLocale,
): number | null {
  const input = latinDigits(text.trim(), locale);
  const formatter = new Intl.NumberFormat(locale);
  const group = formatter
    .formatToParts(1234567)
    .find((part) => part.type === 'group')?.value;
  const normalized = group ? input.replaceAll(group, '') : input;
  if (!/^\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value < 1) return null;
  if (
    group &&
    input.includes(group) &&
    latinDigits(formatter.format(value), locale) !== input
  )
    return null;
  return value;
}
