import { expect, it } from 'vitest';
import type { ReminderStatus } from '../src/core/native/series-native';
import {
  defaultReminder,
  hourlyStart,
  needsReminderRepair,
  nextHourlyTrigger,
  reminderPresentation,
  reminderSaveWarning,
  reminderTestMessage,
} from '../src/features/records/reminder-model';

const recordId = 'series-1';
const reminder = defaultReminder(new Date(2026, 9, 31, 10, 37, 42, 500));
const status: ReminderStatus = {
  notifications: true,
  exact: true,
  doNotDisturb: false,
  availability: { normal: 'available', punctualWithSound: 'available' },
  schedules: [
    {
      recordId,
      nextTriggerAtMillis: Date.now() + 3600000,
      planningState: 'scheduled',
      isExact: false,
      deliveryFailed: false,
      isNotificationActive: false,
      lastTriggeredAtMillis: null,
    },
  ],
};

it('uses the MaschinenLog default and computes the next hourly occurrence', () => {
  expect(reminder).toMatchObject({
    interval: 'monthly',
    day: 28,
    month: 10,
    hour: 9,
    minute: 0,
  });
  expect(new Date(reminder.startsAtMillis).getHours()).toBe(11);
  expect(new Date(reminder.startsAtMillis).getMinutes()).toBe(0);
  expect(nextHourlyTrigger(1000, 1000)).toBe(3601000);
  expect(nextHourlyTrigger(1000, 7201001)).toBe(10801000);
});

it('rejects an hourly start time lost during the clock change', () => {
  const before = process.env.TZ;
  try {
    process.env.TZ = 'Europe/Berlin';
    const date = new Date(2026, 2, 29, 12);
    const time = new Date(2026, 0, 1, 2, 30);
    expect(() => hourlyStart(date, time)).toThrow('Zeitumstellung');
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});

it('distinguishes blocked, overdue, failed and cancelled reminder states', () => {
  const blocked: ReminderStatus = {
    ...status,
    availability: { ...status.availability, normal: 'channelBlocked' },
  };
  expect(reminderPresentation(reminder, blocked, recordId)?.action).toBe(
    'channel',
  );
  expect(reminderSaveWarning(reminder, blocked, recordId)).toContain(
    'blockiert',
  );
  const failed: ReminderStatus = {
    ...status,
    schedules: [
      {
        ...status.schedules[0]!,
        planningState: 'failed',
        nextTriggerAtMillis: null,
      },
    ],
  };
  expect(needsReminderRepair(reminder, failed.schedules[0])).toBe(true);
  expect(reminderPresentation(reminder, failed, recordId)?.title).toBe(
    'Erinnerung nicht geplant',
  );
  const cancelled: ReminderStatus = {
    ...status,
    schedules: [{ ...status.schedules[0]!, planningState: 'cancelFailed' }],
  };
  expect(reminderPresentation(null, cancelled, recordId)?.action).toBe('edit');
  expect(reminderSaveWarning(null, cancelled, recordId)).toContain(
    'nicht ausgeschaltet',
  );
  expect(
    reminderPresentation(reminder, status, recordId, Date.now() + 7200000)
      ?.title,
  ).toBe('Erinnerung steht noch aus');
});

it('explains exact-alarm permission and gives a readable test result', () => {
  const punctual = { ...reminder, deliveryMode: 'punctualWithSound' as const };
  const withoutExact = { ...status, exact: false };
  expect(reminderPresentation(punctual, withoutExact, recordId)?.action).toBe(
    'exact',
  );
  expect(reminderSaveWarning(punctual, withoutExact, recordId)).toContain(
    'Alarme & Erinnerungen',
  );
  expect(reminderTestMessage('posted', true)).toContain('„Nicht stören“');
  expect(reminderTestMessage('channelBlocked', false)).toContain('gesperrt');
});
