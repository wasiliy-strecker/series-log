import { useEffect, useRef, useState } from 'react';
import type { Reminder } from '../../core/domain/models';
import type {
  ReminderStatus,
  ReminderSettingsTarget,
  ReminderTestResult,
} from '../../core/native/series-native';
import { useServices } from '../../core/composition';
import { useFeedback } from '../../core/ui/feedback';
import { positionText } from '../../core/domain/episode-position';
import {
  defaultReminder,
  reminderSettingsFailure,
  reminderTestMessage,
  hourlyStart,
} from './reminder-model';

export function useReminderEditor({
  reminder,
  busy,
  onChange,
  status,
  refreshStatus,
  recordId,
  label,
  categoryLabel,
}: {
  reminder: Reminder | null;
  busy: boolean;
  onChange(value: Reminder | null): void;
  status?: ReminderStatus;
  refreshStatus(): Promise<ReminderStatus | undefined>;
  recordId: string | null;
  label: string;
  categoryLabel: string;
}) {
  const { native, series } = useServices();
  const feedback = useFeedback();
  const [defaults] = useState(defaultReminder);
  const last = useRef(reminder ?? defaults);
  const memory = useRef({
    day:
      reminder &&
      (reminder.interval === 'monthly' || reminder.interval === 'yearly')
        ? reminder.day
        : defaults.day,
    weekday:
      reminder?.interval === 'weekly' ? reminder.day : new Date().getDay() || 7,
    hour: reminder?.interval !== 'hourly' ? (reminder?.hour ?? 9) : 9,
    minute: reminder?.interval !== 'hourly' ? (reminder?.minute ?? 0) : 0,
    start:
      reminder?.interval === 'hourly'
        ? reminder.startsAtMillis
        : defaults.startsAtMillis,
  });
  const operation = useRef(false),
    mounted = useRef(true);
  const [action, setAction] = useState<'test' | 'settings' | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!reminder) return;
    last.current = reminder;
    if (reminder.interval === 'weekly') memory.current.weekday = reminder.day;
    if (reminder.interval === 'monthly' || reminder.interval === 'yearly')
      memory.current.day = reminder.day;
    if (reminder.interval === 'hourly')
      memory.current.start = reminder.startsAtMillis;
    else {
      memory.current.hour = reminder.hour;
      memory.current.minute = reminder.minute;
    }
  }, [reminder]);
  function patch(value: Partial<Reminder>) {
    if (reminder) onChange({ ...reminder, ...value });
  }
  function toggle(enabled: boolean) {
    if (reminder) last.current = reminder;
    onChange(enabled ? last.current : null);
  }
  function interval(value: Reminder['interval']) {
    if (!reminder) return;
    if (reminder.interval === 'weekly') memory.current.weekday = reminder.day;
    else if (reminder.interval === 'monthly' || reminder.interval === 'yearly')
      memory.current.day = reminder.day;
    const start = new Date(memory.current.start);
    patch({
      interval: value,
      day: value === 'weekly' ? memory.current.weekday : memory.current.day,
      startsAtMillis: memory.current.start,
      hour: value === 'hourly' ? start.getHours() : memory.current.hour,
      minute: value === 'hourly' ? start.getMinutes() : memory.current.minute,
    });
  }
  function setHourlyStart(date: Date, time: Date) {
    try {
      const value = hourlyStart(date, time);
      memory.current.start = value;
      patch({
        startsAtMillis: value,
        hour: time.getHours(),
        minute: time.getMinutes(),
      });
    } catch (error) {
      feedback.notify(
        error instanceof Error
          ? error.message
          : 'Bitte eine andere Uhrzeit wählen.',
      );
    }
  }
  async function open(target: ReminderSettingsTarget) {
    if (busy || operation.current) return;
    operation.current = true;
    setAction('settings');
    try {
      const opened = await native.openReminderSettings(
        target,
        target === 'channel' ? (reminder?.deliveryMode ?? 'normal') : null,
      );
      if (!opened && mounted.current)
        feedback.notify(reminderSettingsFailure(target));
      await refreshStatus();
    } catch {
      if (mounted.current) feedback.notify(reminderSettingsFailure(target));
    } finally {
      operation.current = false;
      if (mounted.current) setAction(null);
    }
  }
  async function selectMode(mode: Reminder['deliveryMode']) {
    if (busy || operation.current) return;
    patch({ deliveryMode: mode });
    operation.current = true;
    setAction('settings');
    const exactSettingsFailure = () =>
      feedback.notify(
        `${reminderSettingsFailure('exact')} „Pünktlich mit Ton“ bleibt ausgewählt.`,
      );
    try {
      const current = await refreshStatus();
      if (mode === 'punctualWithSound' && current?.exact !== true) {
        if (
          !(await native.openReminderSettings('exact', null)) &&
          mounted.current
        )
          exactSettingsFailure();
      }
    } catch {
      if (mounted.current) exactSettingsFailure();
    } finally {
      operation.current = false;
      if (mounted.current) setAction(null);
    }
  }
  async function test() {
    if (!reminder || busy || operation.current) return;
    operation.current = true;
    setAction('test');
    let result: ReminderTestResult = 'failed';
    let current = status;
    try {
      current = await refreshStatus();
      const page = recordId
        ? await series.repository.entries(recordId, '', 0, 1)
        : null;
      const latest = page?.rows[0];
      result = await native.testReminder({
        recordId,
        label: label.trim().slice(0, 500) || 'Serie',
        categoryLabel: categoryLabel.trim().slice(0, 500) || 'Serie',
        latestValue: latest ? positionText(latest) : null,
        deliveryMode: reminder.deliveryMode,
      });
      current = (await refreshStatus()) ?? current;
    } catch {
      result = 'failed';
    } finally {
      operation.current = false;
      if (mounted.current) setAction(null);
    }
    if (mounted.current)
      feedback.notify(
        reminderTestMessage(result, current?.doNotDisturb),
        result === 'posted' ? 8000 : 4000,
      );
  }
  return {
    patch,
    toggle,
    interval,
    setHourlyStart,
    open,
    selectMode,
    test,
    action,
    disabled: busy || action !== null,
  };
}
