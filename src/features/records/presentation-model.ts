import { Platform } from 'react-native';
import { localization, t, type Localization } from '../../core/i18n/runtime';
import type {
  EpisodeEntry,
  SeriesRecord,
  Reminder,
  EntryDraft,
  SeriesPhoto,
} from '../../core/domain/models';
import { messages } from '../../core/i18n';
import { positionText } from '../../core/domain/episode-position';
export type HistoryItem = {
  entry: EpisodeEntry;
  photoUri?: string;
  photoCount: number;
  positionLabel: string;
};
export const genreSuggestions = () => Object.values(messages.genres);
export type DashboardItem = {
  record: SeriesRecord;
  latest: EpisodeEntry | null;
  lastEdited: string;
  photo: SeriesPhoto | null;
};
export type RecordSort = 'lastEdited' | 'name' | 'category';
export const sortLabels = () => ({
  lastEdited: t('Zuletzt bearbeitet'),
  name: t('Titel'),
  category: t('Genre'),
});
export const dateTime = (value: string | number) =>
  new Date(value).toLocaleString(localization().formatLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export function entrySummary(entry: EpisodeEntry | null) {
  return entry ? positionText(entry) : t('Noch kein Folgenstand');
}
export function visibleRecords(
  items: DashboardItem[],
  search: string,
  sort: RecordSort,
  locale: Localization = localization(),
) {
  const q = search.trim().toLocaleLowerCase(locale.language);
  return items
    .filter(({ record, latest }) =>
      [
        record.name,
        record.category,
        record.note,
        latest ? positionText(latest, locale) : '',
      ].some((value) => value.toLocaleLowerCase(locale.language).includes(q)),
    )
    .sort(
      (a, b) =>
        (sort === 'lastEdited'
          ? b.lastEdited.localeCompare(a.lastEdited)
          : sort === 'name'
            ? a.record.name.localeCompare(b.record.name, locale.language)
            : a.record.category.localeCompare(
                b.record.category,
                locale.language,
              )) ||
        a.record.name.localeCompare(b.record.name, locale.language) ||
        a.record.id.localeCompare(b.record.id),
    );
}
export function reminderTime(r: Pick<Reminder, 'hour' | 'minute'>) {
  return new Date(2026, 0, 1, r.hour, r.minute).toLocaleTimeString(
    localization().formatLocale,
    { hour: '2-digit', minute: '2-digit' },
  );
}
export function reminderSummary(r: Reminder) {
  const time = reminderTime(r);
  const labels = {
    hourly: t('stündlich ab {p0}', { p0: dateTime(r.startsAtMillis) }),
    daily: t('täglich um {p0}', { p0: time }),
    weekly: t('{p0} um {p1}', {
      p0: new Intl.DateTimeFormat(localization().language, {
        weekday: 'long',
      }).format(new Date(2026, 9, 18 + r.day)),
      p1: time,
    }),
    monthly: t('monatlich am {p0}. um {p1}', { p0: r.day, p1: time }),
    yearly: t('jährlich am {p0} um {p1}', {
      p0: new Date(2024, r.month - 1, r.day).toLocaleDateString(
        localization().formatLocale,
        { day: 'numeric', month: 'numeric' },
      ),
      p1: time,
    }),
  };
  return (
    labels[r.interval] +
    (r.deliveryMode === 'punctualWithSound'
      ? Platform.OS === 'ios'
        ? ' · ' + t('appleReminderSoundTitle')
        : t(' · pünktlich mit Ton')
      : '')
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
