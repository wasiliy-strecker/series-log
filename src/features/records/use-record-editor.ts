import { wholeNumber } from '../../core/domain/progress';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { PermissionsAndroid, Platform } from 'react-native';
import { useServices } from '../../core/composition';
import type { SeriesRecord, Reminder } from '../../core/domain/models';
import { useTask } from '../../core/ui/use-task';
import { errorText } from '../../core/ui/components';
import { useFeedback } from '../../core/ui/feedback';
import { useLeaveGuard } from '../../core/ui/use-leave-guard';
import { categorySuggestions } from './presentation-model';
export function useRecordEditor(id?: string) {
  const { series, refresh, native } = useServices();
  const feedback = useFeedback();
  const [record, setRecord] = useState<SeriesRecord | undefined>(() => {
    if (id) return;
    const now = series.env.now();
    return {
      id: series.env.id(),
      name: '',
      category: 'Drama',
      totalEpisodes: null,
      seasons: [],
      note: '',
      reminder: null,
      createdAt: now,
      updatedAt: now,
    };
  });
  const [initial, setInitial] = useState(() => JSON.stringify(record));
  const [initialReady, setReady] = useState(!id);
  const [suggestions, setSuggestions] = useState(() => categorySuggestions([]));
  const [totalInput, setTotalInput] = useState('');
  const [seasonInputs, setSeasonInputs] = useState<string[]>([]);
  const [initialNumbers, setInitialNumbers] = useState(
    JSON.stringify(['', []]),
  );
  const task = useTask();
  const { setError } = task;
  useEffect(() => {
    let active = true;
    series.repository
      .records()
      .then((records) => {
        if (!active) return;
        setSuggestions(categorySuggestions(records));
        if (id) {
          const found = records.find((r) => r.id === id);
          if (!found) throw new Error('Die Serie wurde nicht gefunden.');
          setRecord(found);
          setInitial(JSON.stringify(found));
          setReady(true);
          const total = found.totalEpisodes?.toString() ?? '';
          const seasons = found.seasons.map((n) => n?.toString() ?? '');
          setTotalInput(total);
          setSeasonInputs(seasons);
          setInitialNumbers(JSON.stringify([total, seasons]));
        }
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, [series, id, setError]);
  const dirty =
    initialReady &&
    (JSON.stringify(record) !== initial ||
      JSON.stringify([totalInput, seasonInputs]) !== initialNumbers);
  const leave = useLeaveGuard({
    dirty,
    busy: task.busy,
    discard: async () => {},
    title: id ? 'Änderungen verwerfen?' : 'Eingaben verwerfen?',
  });
  function change<K extends keyof SeriesRecord>(
    key: K,
    value: SeriesRecord[K],
  ) {
    setRecord((current) => current && { ...current, [key]: value });
  }
  return {
    record,
    dirty,
    change,
    categorySuggestions: suggestions,
    totalInput,
    setTotalInput,
    seasonInputs,
    changeSeason: (index: number, value: string) =>
      setSeasonInputs((items) =>
        items.map((item, i) => (i === index ? value : item)),
      ),
    addSeason: () =>
      setSeasonInputs((items) => (items.length < 200 ? [...items, ''] : items)),
    removeSeason: () => setSeasonInputs((items) => items.slice(0, -1)),
    ...task,
    reminder: (value: Partial<Reminder>) => {
      if (record?.reminder)
        change('reminder', { ...record.reminder, ...value });
    },
    toggleReminder: (enabled: boolean) =>
      change(
        'reminder',
        enabled
          ? {
              interval: 'weekly',
              day: 1,
              month: 1,
              hour: 20,
              minute: 0,
              deliveryMode: 'normal',
              startsAtMillis: Date.now() + 3600000,
            }
          : null,
      ),
    testReminder: (punctual: boolean) =>
      task.run(async () => {
        const result = await native.testReminder(punctual);
        feedback.notify(
          result === 'posted'
            ? 'Test-Erinnerung gesendet. Sie verschwindet nach einer Minute.'
            : 'Die Erinnerung ist in Android blockiert. Bitte die Benachrichtigungseinstellungen prüfen.',
        );
      }),
    openReminderSettings: (exact: boolean) =>
      task.run(() => native.openReminderSettings(exact)),
    save: () =>
      task.run(async () => {
        if (!record) return;
        if (
          record.reminder &&
          Platform.OS === 'android' &&
          Number(Platform.Version) >= 33
        )
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        const warnings = await series.saveRecord({
          ...record,
          totalEpisodes: totalInput.trim()
            ? wholeNumber(totalInput, 'Gesamtfolgenzahl', 1)
            : null,
          seasons: seasonInputs.map((value, i) =>
            value.trim() ? wholeNumber(value, `Staffel ${i + 1}`, 1) : null,
          ),
        });
        refresh();
        leave(() => {
          if (id)
            router.dismissTo({
              pathname: '/record/[id]',
              params: { id: record.id },
            });
          else
            router.replace({
              pathname: '/record/[id]',
              params: { id: record.id },
            });
        });
        feedback.notify(
          warnings.join('\n') ||
            (id
              ? 'Änderungen an der Serie gespeichert.'
              : 'Serie gespeichert. Als Nächstes kannst du den ersten Folgenstand erfassen.'),
        );
      }),
  };
}
