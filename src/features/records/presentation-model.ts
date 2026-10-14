import type {
  EpisodeEntry,
  SeriesRecord,
  Reminder,
  EntryDraft,
  SeriesPhoto,
} from '../../core/domain/models';
import { categories } from '../../core/domain/models';
import { episodeDelta, positionText } from '../../core/domain/progress';

export type HistoryItem = {
  entry: EpisodeEntry;
  photoUri?: string;
  photoCount: number;
  positionLabel: string;
  comparison: string | null;
};
export function historyComparison(
  record: SeriesRecord,
  entry: EpisodeEntry,
  previous: EpisodeEntry | null,
): string | null {
  if (!previous) return null;
  const delta = episodeDelta(record, entry, previous);
  if (delta === null)
    return 'Staffelwechsel · Zuwachs an gesehenen Folgen noch unbekannt';
  if (delta < 0)
    return `${Math.abs(delta)} Folgen zurück · niedrigerer Folgenstand`;
  if (delta === 0) return 'Unveränderter Folgenstand';
  return `+${delta} ${delta === 1 ? 'Folge' : 'Folgen'} seit dem vorigen Stand`;
}
export function categorySuggestions(records: SeriesRecord[]): string[] {
  const unique = new Map<string, string>();
  for (const category of [
    ...categories,
    ...records.map((r) => r.category.trim()).filter(Boolean),
  ]) {
    const key = category.toLocaleLowerCase('de-DE');
    if (!unique.has(key)) unique.set(key, category);
  }
  return [...unique.values()];
}
export type DashboardItem = {
  record: SeriesRecord;
  latest: EpisodeEntry | null;
  lastEdited: string;
  photo: SeriesPhoto | null;
};
export type RecordSort = 'lastEdited' | 'name' | 'category';
export const sortLabels: Record<RecordSort, string> = {
  lastEdited: 'Zuletzt bearbeitet',
  name: 'Titel',
  category: 'Genre',
};
export const dateTime = (value: string | number) =>
  new Date(value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export function entrySummary(entry: EpisodeEntry | null) {
  return entry ? positionText(entry) : 'Noch kein Folgenstand';
}
export function visibleRecords(
  items: DashboardItem[],
  search: string,
  sort: RecordSort,
) {
  const q = search.trim().toLocaleLowerCase('de-DE');
  return items
    .filter(({ record, latest }) =>
      [
        record.name,
        record.category,
        record.note,
        latest ? entrySummary(latest) : '',
      ].some((value) => value.toLocaleLowerCase('de-DE').includes(q)),
    )
    .sort(
      (a, b) =>
        (sort === 'lastEdited'
          ? b.lastEdited.localeCompare(a.lastEdited)
          : sort === 'name'
            ? a.record.name.localeCompare(b.record.name, 'de-DE')
            : a.record.category.localeCompare(b.record.category, 'de-DE')) ||
        a.record.name.localeCompare(b.record.name, 'de-DE') ||
        a.record.id.localeCompare(b.record.id),
    );
}
export function reminderSummary(r: Reminder) {
  const time = `${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')} Uhr`;
  const labels = {
    hourly: `stündlich ab ${dateTime(r.startsAtMillis)}`,
    daily: `täglich um ${time}`,
    weekly: `${['montags', 'dienstags', 'mittwochs', 'donnerstags', 'freitags', 'samstags', 'sonntags'][r.day - 1]} um ${time}`,
    monthly: `monatlich am ${r.day}. um ${time}`,
    yearly: `jährlich am ${r.day}.${r.month}. um ${time}`,
  };
  return (
    labels[r.interval] +
    (r.deliveryMode === 'punctualWithSound' ? ' · pünktlich mit Ton' : '')
  );
}
export function capturePhase(draft: EntryDraft): 'choose' | 'form' {
  return draft.entryId ||
    draft.form.attachments.length ||
    draft.form.note ||
    draft.form.episode
    ? 'form'
    : (draft.captureStage ?? 'choose');
}
