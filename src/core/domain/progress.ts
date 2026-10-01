import type { EpisodeEntry, SeriesRecord } from './models';

export type Position = Pick<EpisodeEntry, 'season' | 'episode'>;

export function wholeNumber(
  text: string,
  label: string,
  min = 0,
  max = 1000000,
): number {
  if (!/^\d+$/.test(text.trim()))
    throw new Error(`${label}: Bitte eine ganze Zahl ab ${min} eingeben.`);
  const value = Number(text.trim());
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(
      `${label}: Bitte eine Zahl zwischen ${min} und ${max} eingeben.`,
    );
  return value;
}

export function positionText(position: Position): string {
  return `Staffel ${position.season} · Folge ${position.episode}`;
}

// A position means all earlier seasons and episodes have been watched in order.
// Unknown season lengths deliberately prevent an invented cumulative value.
export function watchedEpisodes(
  record: SeriesRecord,
  position: Position,
): number | null {
  let count = position.episode;
  for (let season = 1; season < position.season; season++) {
    const length = record.seasons[season - 1];
    if (length == null) return null;
    count += length;
  }
  return count;
}

export function progress(record: SeriesRecord, position: Position | null) {
  const watched = position ? watchedEpisodes(record, position) : 0;
  const percent =
    watched !== null && record.totalEpisodes !== null
      ? Math.floor((watched / record.totalEpisodes) * 100)
      : null;
  const text =
    watched === null
      ? 'Gesamtfortschritt offen · Folgenzahlen früherer Staffeln ergänzen'
      : record.totalEpisodes !== null
        ? `${watched} von ${record.totalEpisodes} Folgen gesehen`
        : `${watched} ${watched === 1 ? 'Folge' : 'Folgen'} gesehen · Gesamtzahl offen`;
  return { watched, percent, text };
}

export function episodeDelta(
  record: SeriesRecord,
  current: Position,
  previous: Position,
): number | null {
  if (current.season === previous.season)
    return current.episode - previous.episode;
  if (current.season < previous.season) {
    const reverse = episodeDelta(record, previous, current);
    return reverse === null ? null : -reverse;
  }
  let delta = current.episode - previous.episode;
  for (let season = previous.season; season < current.season; season++) {
    const length = record.seasons[season - 1];
    if (length == null) return null;
    delta += length;
  }
  return delta;
}

export function validateProgress(
  record: SeriesRecord,
  positions: Position[],
): void {
  const known = record.seasons.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  if (record.totalEpisodes !== null && known > record.totalEpisodes)
    throw new Error(
      'Die bekannten Staffelfolgen überschreiten die Gesamtfolgenzahl. Bitte die Gesamtzahl erhöhen oder offen lassen.',
    );
  for (const position of positions) {
    const length = record.seasons[position.season - 1];
    if (length !== undefined && length !== null && position.episode > length)
      throw new Error(
        `Staffel ${position.season} hat ${length} Folgen. Ein gespeicherter Folgenstand darf diese Zahl nicht überschreiten.`,
      );
    let minimumWatched = position.episode;
    for (let season = 1; season < position.season; season++)
      minimumWatched += record.seasons[season - 1] ?? 1;
    if (record.totalEpisodes !== null && minimumWatched > record.totalEpisodes)
      throw new Error(
        'Der Folgenstand überschreitet die Gesamtfolgenzahl. Bitte zuerst die Serienangaben anpassen.',
      );
  }
}
