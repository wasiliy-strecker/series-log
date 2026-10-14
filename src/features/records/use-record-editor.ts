import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { PermissionsAndroid, Platform } from 'react-native';
import { useServices } from '../../core/composition';
import type { SeriesRecord } from '../../core/domain/models';
import { useTask } from '../../core/ui/use-task';
import { errorText } from '../../core/ui/components';
import { useFeedback } from '../../core/ui/feedback';
import { useLeaveGuard } from '../../core/ui/use-leave-guard';
import { categorySuggestions } from './presentation-model';
import { useReminderStatusSnapshot } from './use-reminder-status';
import {
  needsReminderRepair,
  reminderSchedule,
  reminderSaveWarning,
} from './reminder-model';
import { useFormErrors } from '../../core/ui/use-form-errors';
import {
  recordFieldOrder,
  recordSaveFieldErrors,
  validateRecordForm,
} from './record-form-validation';
export function useRecordEditor(id?: string, returnToEntry = false) {
  const { series, refresh, native } = useServices();
  const reminderState = useReminderStatusSnapshot();
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
  const [initialTotal, setInitialTotal] = useState('');
  const task = useTask();
  const { setError } = task;
  const formErrors = useFormErrors();
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
          setTotalInput(total);
          setInitialTotal(total);
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
    (JSON.stringify(record) !== initial || totalInput !== initialTotal);
  const reminderNeedsRepair =
    !!id &&
    reminderState.loaded &&
    needsReminderRepair(
      record?.reminder ?? null,
      reminderSchedule(reminderState.status, id),
    );
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
    formErrors.clear(key);
    setRecord((current) => current && { ...current, [key]: value });
  }
  return {
    record,
    fieldErrors: formErrors.fieldErrors,
    errorTarget: formErrors.errorTarget,
    dirty,
    reminderStatus: reminderState.status,
    refreshReminderStatus: reminderState.refresh,
    reminderNeedsRepair,
    change,
    categorySuggestions: suggestions,
    totalInput,
    setTotalInput: (value: string) => {
      formErrors.clear('totalEpisodes');
      setTotalInput(value);
    },
    ...task,
    save: () => {
      if (!record) return Promise.resolve(undefined);
      const validation = validateRecordForm(record, totalInput);
      if (!validation.value) {
        setError('');
        formErrors.show(validation.errors, recordFieldOrder);
        return Promise.resolve(undefined);
      }
      const value = validation.value;
      formErrors.clear();
      return task.run(async () => {
        if (
          record.reminder &&
          Platform.OS === 'android' &&
          Number(Platform.Version) >= 33
        )
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        let warnings;
        try {
          warnings = await series.saveRecord(value);
        } catch (error) {
          const errors = recordSaveFieldErrors(error);
          if (!errors) throw error;
          formErrors.show(errors, recordFieldOrder);
          return;
        }
        refresh();
        let reminderWarning: string | null;
        try {
          reminderWarning = reminderSaveWarning(
            record.reminder,
            await native.reminderStatus(),
            record.id,
          );
        } catch {
          reminderWarning = reminderSaveWarning(
            record.reminder,
            undefined,
            record.id,
          );
        }
        if (
          !reminderWarning &&
          warnings.some((warning) =>
            warning.startsWith(
              'Gespeichert. Erinnerungen konnten nicht aktualisiert',
            ),
          )
        )
          reminderWarning =
            'Daten gespeichert. Die Erinnerung konnte nicht bestätigt werden. Öffne die Erinnerung und speichere erneut.';
        leave(() => {
          if (id && returnToEntry && router.canGoBack()) router.back();
          else if (id)
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
          reminderWarning ||
            warnings.join('\n') ||
            (id
              ? returnToEntry
                ? 'Serienangaben gespeichert. Du kannst deinen Folgenstand jetzt speichern.'
                : 'Änderungen an der Serie gespeichert.'
              : 'Serie gespeichert. Als Nächstes kannst du den ersten Folgenstand erfassen.'),
        );
      });
    },
  };
}
