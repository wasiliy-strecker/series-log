import type { Reminder } from '../../core/domain/models';
import type {
  ReminderStatus,
  ReminderScheduleStatus,
  ReminderTestResult,
  ReminderSettingsTarget,
} from '../../core/native/series-native';
import { dateTime } from './presentation-model';

export const reminderIntervals = {
  hourly: 'Stündlich',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  yearly: 'Jährlich',
};
export const weekdays = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];
export const reminderModes = {
  normal: {
    title: 'Normale Erinnerung',
    description:
      'Kann leicht verzögert erscheinen. Die Systemeinstellung „Nicht stören“ wird berücksichtigt.',
    icon: 'notifications_outlined' as const,
  },
  punctualWithSound: {
    title: 'Pünktlich mit Ton',
    description:
      'Wird möglichst genau zur gewählten Uhrzeit wie ein Alarm ausgelöst.',
    icon: 'alarm_outlined' as const,
  },
};
export const testReminderHint =
  'Ziehe die Benachrichtigungsleiste herunter. Die Test-Erinnerung verschwindet nach einer Minute.';
export function defaultReminder(now = new Date()): Reminder {
  return {
    interval: 'monthly',
    day: Math.min(now.getDate(), 28),
    month: now.getMonth() + 1,
    hour: 9,
    minute: 0,
    deliveryMode: 'normal',
    startsAtMillis:
      now.getTime() -
      now.getMinutes() * 60000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds() +
      3600000,
  };
}
export function nextHourlyTrigger(start: number, now = Date.now()): number {
  return start > now
    ? start
    : start + (Math.floor((now - start) / 3600000) + 1) * 3600000;
}
export function hourlyStart(date: Date, time: Date): number {
  const value = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
  );
  if (
    value.getHours() !== time.getHours() ||
    value.getMinutes() !== time.getMinutes() ||
    value.getDate() !== date.getDate()
  )
    throw new Error(
      'Diese Uhrzeit ist wegen der Zeitumstellung nicht verfügbar. Bitte wähle eine andere Uhrzeit.',
    );
  return value.getTime();
}
export function reminderAvailability(
  status: ReminderStatus | undefined,
  mode: Reminder['deliveryMode'],
) {
  return (
    status?.availability?.[mode] ??
    (status?.notifications === false ? 'appBlocked' : 'unknown')
  );
}
export function reminderSchedule(
  status: ReminderStatus | undefined,
  recordId: string,
) {
  return status?.schedules.find((schedule) => schedule.recordId === recordId);
}
export function needsReminderRepair(
  reminder: Reminder | null,
  schedule: ReminderScheduleStatus | undefined,
): boolean {
  return (
    schedule?.planningState === 'cancelFailed' ||
    (!!reminder &&
      (schedule?.planningState !== 'scheduled' ||
        schedule.nextTriggerAtMillis === null ||
        (reminder.deliveryMode === 'punctualWithSound' &&
          schedule.isExact !== true)))
  );
}
export function reminderSaveWarning(
  reminder: Reminder | null,
  status: ReminderStatus | undefined,
  recordId: string,
): string | null {
  const schedule = reminderSchedule(status, recordId);
  if (schedule?.planningState === 'cancelFailed')
    return 'Daten gespeichert. Die Erinnerung konnte nicht ausgeschaltet werden. Öffne die Erinnerung und speichere erneut.';
  if (!reminder)
    return status
      ? null
      : 'Daten gespeichert. Der Erinnerungsstatus konnte nicht geprüft werden. Öffne die Erinnerung und speichere erneut.';
  const availability = reminderAvailability(status, reminder.deliveryMode);
  if (availability === 'appBlocked' || availability === 'channelBlocked')
    return 'Daten gespeichert. Erinnerungen sind in Android blockiert. Öffne die Erinnerung und dann die Android-Einstellungen.';
  if (!status || availability === 'unknown')
    return 'Daten gespeichert. Der Erinnerungsstatus konnte nicht geprüft werden. Öffne die Erinnerung und speichere erneut.';
  if (
    schedule?.planningState !== 'scheduled' ||
    schedule.nextTriggerAtMillis === null
  )
    return 'Daten gespeichert. Die Erinnerung konnte nicht bestätigt werden. Öffne die Erinnerung und speichere erneut.';
  if (
    reminder.deliveryMode === 'punctualWithSound' &&
    (!status.exact || schedule.isExact !== true)
  )
    return 'Daten gespeichert. Für eine pünktliche Erinnerung öffne „Alarme & Erinnerungen“ in den Android-Einstellungen.';
  return null;
}
export function reminderTestMessage(
  result: ReminderTestResult,
  quiet: boolean | null | undefined,
): string {
  if (result === 'posted')
    return (
      'Test-Erinnerung wurde an Android übergeben. ' +
      testReminderHint +
      (quiet === true
        ? ' „Nicht stören“ ist aktiv. Ton und Banner können unterdrückt werden.'
        : '')
    );
  if (result === 'appBlocked') return 'Benachrichtigungen sind nicht erlaubt.';
  if (result === 'channelBlocked')
    return 'Diese Erinnerungsart ist in Android gesperrt.';
  return 'Test-Erinnerung konnte nicht angezeigt werden.';
}
export function reminderSettingsFailure(
  target: ReminderSettingsTarget,
): string {
  if (target === 'exact')
    return 'Die Android-Einstellung „Alarme & Erinnerungen“ konnte nicht geöffnet werden. „Pünktlich mit Ton“ bleibt ausgewählt.';
  if (target === 'doNotDisturb')
    return 'Die Systemeinstellungen konnten nicht geöffnet werden. Du findest „Nicht stören“ in den Einstellungen deines Smartphones.';
  return 'Die Einstellungen konnten nicht geöffnet werden. Öffne in den Einstellungen deines Smartphones „Apps“, dann „SerienLog“ und „Benachrichtigungen“.';
}
export type ReminderPresentation = {
  title: string;
  description: string;
  error: boolean;
  action: 'edit' | ReminderSettingsTarget | null;
};
export function reminderPresentation(
  reminder: Reminder | null,
  status: ReminderStatus | undefined,
  recordId: string,
  now = Date.now(),
): ReminderPresentation | null {
  const schedule = reminderSchedule(status, recordId);
  if (schedule?.planningState === 'cancelFailed')
    return {
      title: 'Ausschalten fehlgeschlagen',
      description: 'Bitte öffne die Erinnerung und speichere erneut.',
      error: true,
      action: 'edit',
    };
  if (!reminder) return null;
  const availability = reminderAvailability(status, reminder.deliveryMode);
  if (availability === 'appBlocked' || availability === 'channelBlocked')
    return {
      title: 'Erinnerung blockiert',
      description:
        availability === 'appBlocked'
          ? 'Benachrichtigungen sind ausgeschaltet.'
          : 'Diese Erinnerungsart ist ausgeschaltet.',
      error: true,
      action: availability === 'appBlocked' ? 'notifications' : 'channel',
    };
  if (
    schedule?.planningState === 'failed' ||
    schedule?.planningState === 'none'
  )
    return {
      title: 'Erinnerung nicht geplant',
      description: 'Bitte öffne die Erinnerung und speichere erneut.',
      error: true,
      action: 'edit',
    };
  if (reminder.deliveryMode === 'punctualWithSound' && status?.exact === false)
    return {
      title: 'Pünktlichkeit nicht erlaubt',
      description:
        'Erlaube „Alarme & Erinnerungen“ in Android. Bis dahin kann die Erinnerung verspätet erscheinen.',
      error: true,
      action: 'exact',
    };
  if (
    reminder.deliveryMode === 'punctualWithSound' &&
    status?.exact === true &&
    schedule?.isExact === false
  )
    return {
      title: 'Pünktliche Planung ausstehend',
      description:
        'Der Termin ist noch ungenau geplant. Öffne die Erinnerung und speichere erneut.',
      error: false,
      action: 'edit',
    };
  if (schedule?.deliveryFailed)
    return {
      title: 'Letzte Zustellung fehlgeschlagen',
      description:
        'Bitte öffne die Erinnerung und nutze „Erinnerung jetzt testen“.',
      error: true,
      action: 'edit',
    };
  if (
    schedule?.planningState !== 'scheduled' ||
    schedule.nextTriggerAtMillis === null ||
    availability !== 'available' ||
    (reminder.deliveryMode === 'punctualWithSound' &&
      (!status || schedule.isExact === null))
  )
    return {
      title: 'Planungsstatus unbekannt',
      description:
        'Der Erinnerungsstatus konnte nicht bestätigt werden. Öffne die Erinnerung zum Prüfen.',
      error: false,
      action: 'edit',
    };
  const due = schedule.nextTriggerAtMillis <= now;
  return {
    title: due ? 'Erinnerung steht noch aus' : 'Nächste Erinnerung',
    description:
      dateTime(schedule.nextTriggerAtMillis) +
      ' Uhr' +
      (due ? '. Android hat diesen Termin noch nicht verarbeitet.' : ''),
    error: false,
    action: null,
  };
}
