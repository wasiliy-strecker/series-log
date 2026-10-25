import { positiveInteger } from '../i18n/numbers';
import {
  t,
  localization,
  type Localization,
  translator,
} from '../i18n/runtime';
import type { EpisodeEntry } from './models';
export type Position = Pick<EpisodeEntry, 'season' | 'episode'>;
export function wholeNumber(text: string, label: string): number {
  const value = positiveInteger(text);
  if (value === null)
    throw new Error(
      t('{p0}: Bitte eine ganze Zahl größer als 0 eingeben.', {
        p0: label,
      }),
    );
  return value;
}
export function positionText(
  position: Position,
  locale: Localization = localization(),
): string {
  return translator(locale)('Staffel {p0} · Folge {p1}', {
    p0: new Intl.NumberFormat(locale.formatLocale, {
      useGrouping: false,
    }).format(position.season),
    p1: new Intl.NumberFormat(locale.formatLocale, {
      useGrouping: false,
    }).format(position.episode),
  });
}
