import { positionText } from '../../core/domain/episode-position';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { useServices } from '../../core/composition';
import type {
  EntryDraft,
  SeriesRecord,
  EpisodeEntry,
  SeriesPhoto,
} from '../../core/domain/models';
import { PAGE_SIZE } from '../../core/domain/models';
import { useReminderStatus } from './use-reminder-status';
import { errorText } from '../../core/ui/components';
import { useTask } from '../../core/ui/use-task';
import {
  visibleRecords,
  type DashboardItem,
  type HistoryItem,
  type RecordSort,
} from './presentation-model';
export function useRecords() {
  const { series, revision } = useServices();
  const [items, setItems] = useState<DashboardItem[]>([]),
    [drafts, setDrafts] = useState<EntryDraft[]>([]),
    [search, setSearch] = useState(''),
    [sort, setSort] = useState<RecordSort>('lastEdited'),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const loaded = useRef(false);
  const status = useReminderStatus();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(!loaded.current);
      Promise.all([series.repository.dashboard(), series.repository.drafts()])
        .then(([r, d]) => {
          if (active) {
            loaded.current = true;
            setItems(r);
            setDrafts(d);
            setError('');
          }
        })
        .catch((e) => {
          if (active) setError(errorText(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
      // Revision/retry tokens intentionally reload persisted data on focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [series, revision, retry]),
  );
  const visibleItems = useMemo(
    () => visibleRecords(items, search, sort),
    [items, search, sort],
  );
  return {
    items: visibleItems,
    empty: !items.length,
    drafts,
    search,
    setSearch,
    sort,
    setSort,
    loading,
    error,
    status,
    retry: () => setRetry((n) => n + 1),
  };
}
export function useRecordDetail(id: string, history = false) {
  const { series, native, revision, refresh } = useServices();
  const [record, setRecord] = useState<SeriesRecord>(),
    [entries, setEntries] = useState<EpisodeEntry[]>([]),
    [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0),
    [search, setSearch] = useState(''),
    [loading, setLoading] = useState(true);
  const task = useTask();
  const { setError } = task;
  const status = useReminderStatus();
  const [hasAttachments, setHasAttachments] = useState(false);
  const [photo, setPhoto] = useState<SeriesPhoto | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        series.repository.records(),
        series.repository.entries(
          id,
          history ? search : '',
          history ? offset : 0,
        ),
        history ? Promise.resolve(null) : series.repository.latestPhoto(id),
      ])
        .then(([records, page, latestPhoto]) => {
          if (!active) return;
          setRecord(records.find((r) => r.id === id));
          setEntries(page.rows);
          setTotal(page.total);
          setHasAttachments(page.hasAttachments);
          setPhoto(latestPhoto);
          setError('');
          if (offset && offset >= page.total)
            setOffset(
              Math.max(0, Math.floor((page.total - 1) / PAGE_SIZE) * PAGE_SIZE),
            );
        })
        .catch((e) => {
          if (active) setError(errorText(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      void native.acknowledge(id).catch(() => {});
      return () => {
        active = false;
      };
      // Revision/retry tokens intentionally reload persisted data on focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [series, native, id, history, search, offset, revision, setError]),
  );
  return {
    record,
    entries,
    hasAttachments,
    photo,
    historyItems: entries.map((entry): HistoryItem => {
      const photos = entry.attachments.filter((a) => a.kind === 'photo');
      return {
        entry,
        photoUri: photos[0] ? series.vault.uri(photos[0].file) : undefined,
        photoCount: photos.length,
        positionLabel: positionText(entry),
      };
    }),
    total,
    offset,
    setOffset,
    search,
    setSearch: (v: string) => {
      setOffset(0);
      setSearch(v);
    },
    loading,
    status,
    ...task,
    remove: () =>
      task.run(async () => {
        await series.delete('record', id);
        refresh();
        router.replace('/');
      }),
  };
}
