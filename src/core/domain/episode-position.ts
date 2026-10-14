import type { EpisodeEntry } from './models';

export type Position = Pick<EpisodeEntry, 'season' | 'episode'>;

export function wholeNumber(text: string, label: string): number {
  const value = Number(text.trim());
  if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(value) || value < 1)
    throw new Error(`${label}: Bitte eine ganze Zahl größer als 0 eingeben.`);
  return value;
}

export function positionText(position: Position): string {
  return `Staffel ${position.season} · Folge ${position.episode}`;
}
