import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useServices } from '../../core/composition';
import {
  type SeriesRecord,
  type EpisodeEntry,
  type Attachment,
  type EntryDraft,
  type EntryForm,
} from '../../core/domain/models';
import { useTask } from '../../core/ui/use-task';
import { errorText } from '../../core/ui/components';
import { useFeedback } from '../../core/ui/feedback';
import { useLeaveGuard } from '../../core/ui/use-leave-guard';
import { capturePhase } from '../records/presentation-model';
import { useFormErrors } from '../../core/ui/use-form-errors';
import {
  entryFieldOrder,
  entrySaveFieldErrors,
  validateEntryForm,
} from './entry-form-validation';
export function useEntryEditor(recordId: string, entryId?: string) {
  const { series, media, refresh } = useServices();
  const feedback = useFeedback();
  const [draft, setDraft] = useState<EntryDraft>(),
    [record, setRecord] = useState<SeriesRecord>(),
    [latest, setLatest] = useState<EpisodeEntry>(),
    [initialForm, setInitialForm] = useState('');
  const current = useRef<EntryDraft | undefined>(undefined),
    initial = useRef(''),
    committed = useRef(false);
  const task = useTask();
  const { setError } = task;
  const formErrors = useFormErrors();
  useEffect(() => {
    let active = true;
    (async () => {
      const [data, savedEntry] = await Promise.all([
        series.repository.snapshot(),
        entryId ? series.repository.entry(entryId) : null,
      ]);
      const record = data.records.find((r) => r.id === recordId);
      if (
        !record ||
        (entryId && (!savedEntry || savedEntry.recordId !== recordId))
      )
        throw new Error('Serie oder Folgenstand nicht gefunden.');
      const lastEntry = data.entries
        .filter((e) => e.recordId === recordId)
        .sort(
          (a, b) =>
            b.occurredAt.localeCompare(a.occurredAt) ||
            b.id.localeCompare(a.id),
        )[0];
      const saved = await series.draft(recordId, savedEntry ?? undefined);
      const original: EntryForm = savedEntry
        ? {
            season: String(savedEntry.season),
            episode: String(savedEntry.episode),
            occurredAt: savedEntry.occurredAt,
            note: savedEntry.note,
            attachments: savedEntry.attachments,
          }
        : {
            season: String(lastEntry?.season ?? 1),
            episode: '',
            occurredAt: saved.createdAt,
            note: '',
            attachments: [],
          };
      if (active) {
        initial.current = JSON.stringify(original);
        setInitialForm(initial.current);
        current.current = saved;
        setDraft(saved);
        setRecord(record);
        setLatest(lastEntry);
      }
    })().catch((e) => setError(errorText(e)));
    return () => {
      active = false;
      const d = current.current;
      if (d && !committed.current && JSON.stringify(d.form) === initial.current)
        void series.discard(d).catch(() => {});
    };
  }, [series, recordId, entryId, setError]);
  const dirty = !!draft && JSON.stringify(draft.form) !== initialForm;
  const leave = useLeaveGuard({
    dirty,
    busy: task.busy,
    title: entryId ? 'Änderungen verwerfen?' : 'Folgenstand verwerfen?',
    discard: async () => {
      if (current.current) await series.discard(current.current);
      committed.current = true;
      refresh();
    },
  });
  function apply(next: EntryDraft) {
    current.current = next;
    setDraft(next);
    return series.persistDraft(next);
  }
  function change<K extends keyof EntryForm>(key: K, value: EntryForm[K]) {
    if (!current.current) return;
    formErrors.clear(key);
    void apply({
      ...current.current,
      ...(key === 'season' ? { completedSeason: undefined } : {}),
      form: { ...current.current.form, [key]: value },
    }).catch((e) =>
      setError(`Entwurf konnte nicht gesichert werden: ${errorText(e)}`),
    );
  }
  function setAttachments(items: Attachment[]) {
    change('attachments', [
      ...items.filter((a) => a.kind === 'photo'),
      ...items.filter((a) => a.kind === 'pdf'),
    ]);
  }
  return {
    draft,
    record,
    latest,
    fieldErrors: formErrors.fieldErrors,
    errorTarget: formErrors.errorTarget,
    dirty,
    phase: draft ? capturePhase(draft) : 'choose',
    change,
    setAttachments,
    ...task,
    nextSeason: () => {
      const d = current.current;
      if (!d || !record) return Promise.resolve(undefined);
      const validation = validateEntryForm(d.form, record);
      if (!validation.position) {
        setError('');
        formErrors.show(validation.errors, entryFieldOrder);
        return Promise.resolve(undefined);
      }
      const position = validation.position;
      formErrors.clear();
      return task.run(async () => {
        const d = current.current;
        if (!d || !record) return;
        const season = position.season;
        const episode = position.episode;
        if (season >= 200) {
          formErrors.show(
            { season: 'Staffel 200 ist die letzte mögliche Staffel.' },
            entryFieldOrder,
          );
          return;
        }
        if (episode < 1) {
          formErrors.show(
            {
              episode:
                'Zum Abschließen muss mindestens eine Folge gesehen sein.',
            },
            entryFieldOrder,
          );
          return;
        }
        const length = record.seasons[season - 1];
        if (length != null && episode !== length) {
          formErrors.show(
            {
              episode: `Für den Wechsel muss Staffel ${season} abgeschlossen sein. Trage zuerst die letzte Folge ${length} ein.`,
            },
            entryFieldOrder,
          );
          return;
        }
        if (
          !(await feedback.confirm(
            'Staffel abschließen?',
            `Staffel ${season} mit ${episode} Folgen als vollständig gesehen bestätigen und zu Staffel ${season + 1} wechseln? Die nächste Staffel beginnt bei Folge 0. Gespeichert wird erst mit „Bestätigen & speichern“.`,
          ))
        )
          return;
        await apply({
          ...d,
          completedSeason: { season, episodes: episode },
          form: { ...d.form, season: String(season + 1), episode: '0' },
        });
      });
    },
    chooseManual: () =>
      task.run(async () => {
        if (!current.current) return;
        const next = {
          ...current.current,
          captureStage: 'form' as const,
          captureSource: 'manual' as const,
        };
        await apply(next);
      }),
    pick: (source: NonNullable<EntryDraft['external']>, replaceId?: string) =>
      task.run(async () => {
        if (!current.current) return;
        await apply({ ...current.current, external: source });
        const result = await media.pick(source, !replaceId);
        const before = current.current.form.attachments;
        let attachments = [...before];
        if (replaceId && result.attachments[0])
          attachments = before.map((a) =>
            a.id === replaceId ? result.attachments[0]! : a,
          );
        else attachments.push(...result.attachments);
        try {
          await apply({
            ...current.current,
            external: null,
            captureStage: attachments.length
              ? 'form'
              : current.current.captureStage,
            captureSource:
              current.current.captureSource ??
              (attachments.length ? 'photo' : undefined),
            form: {
              ...current.current.form,
              attachments: [
                ...attachments.filter((a) => a.kind === 'photo'),
                ...attachments.filter((a) => a.kind === 'pdf'),
              ],
            },
          });
        } catch (error) {
          current.current = {
            ...current.current,
            form: { ...current.current.form, attachments: before },
          };
          setDraft(current.current);
          await series.cleanup(result.attachments.map((a) => a.file));
          throw error;
        }
        if (result.failures.length) setError(result.failures.join('\n'));
      }),
    remove: (id: string) =>
      setAttachments(
        (current.current?.form.attachments ?? []).filter((a) => a.id !== id),
      ),
    reorderKind: (items: Attachment[]) => {
      if (!items.length) return;
      const kind = items[0]!.kind;
      const all = current.current?.form.attachments ?? [];
      setAttachments([...all.filter((a) => a.kind !== kind), ...items]);
    },
    move: (id: string, delta: number) => {
      const items = [...(current.current?.form.attachments ?? [])];
      const index = items.findIndex((a) => a.id === id),
        item = items[index],
        next = items[index + delta];
      if (!item || !next || item.kind !== next.kind) return;
      items[index] = next;
      items[index + delta] = item;
      setAttachments(items);
    },
    save: () => {
      const d = current.current;
      if (!d) return Promise.resolve(undefined);
      const validation = validateEntryForm(d.form, record, !!d.completedSeason);
      if (!validation.position) {
        setError('');
        formErrors.show(validation.errors, entryFieldOrder);
        return Promise.resolve(undefined);
      }
      const position = validation.position;
      formErrors.clear();
      return task.run(async () => {
        if (
          !d.completedSeason &&
          position.season > (latest?.season ?? 1) &&
          !(await feedback.confirm(
            'Staffelwechsel bestätigen?',
            `Du speicherst einen Stand in Staffel ${position.season}. Der Gesamtfortschritt setzt voraus, dass frühere Staffeln vollständig gesehen sind. Bei unbekannten Staffellängen bleibt er offen.`,
          ))
        )
          return;
        if (
          !entryId &&
          latest &&
          (position.season < latest.season ||
            (position.season === latest.season &&
              position.episode < latest.episode)) &&
          !(await feedback.confirm(
            'Niedrigeren Folgenstand speichern?',
            'Dieser Stand liegt vor deinem letzten Folgenstand. Der Verlauf bleibt erhalten. Für die Übersicht zählt der zeitlich neueste Eintrag.',
          ))
        )
          return;
        if (
          new Date(d.form.occurredAt).getTime() > Date.now() + 60000 &&
          !(await feedback.confirm(
            'Zeitpunkt liegt in der Zukunft',
            'Diesen Folgenstand mit dem zukünftigen Zeitpunkt speichern?',
          ))
        )
          return;
        await series.persistDraft(d);
        let result;
        try {
          result = await series.saveEntry(d);
        } catch (error) {
          const errors = entrySaveFieldErrors(error);
          if (!errors) throw error;
          formErrors.show(errors, entryFieldOrder);
          return;
        }
        committed.current = true;
        refresh();
        leave(() => {
          if (entryId)
            router.dismissTo({
              pathname: '/entry/[id]',
              params: { id: result.entry.id },
            });
          else
            router.replace({
              pathname: '/entry/[id]',
              params: { id: result.entry.id },
            });
        });
        feedback.notify(
          result.warnings.join('\n') ||
            (entryId ? 'Änderungen gespeichert.' : 'Folgenstand gespeichert.'),
        );
      });
    },
  };
}
