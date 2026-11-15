import { beforeEach, expect, it, vi } from 'vitest';
import { Platform } from 'react-native';
import { isMac } from '../src/core/native/platform';
import { nativePasswordKey } from '../src/core/backup/password-key';
import {
  defaultReminder,
  needsReminderRepair,
  reminderSaveWarning,
  reminderPresentation,
  reminderModes,
  reminderTestMessage,
} from '../src/features/records/reminder-model';
import { reminderTime } from '../src/features/records/presentation-model';
import type { ReminderStatus } from '../src/core/native/series-native';
const derive = vi.hoisted(() => vi.fn());
vi.mock('expo', () => ({
  requireNativeModule: () => ({ deriveBackupKey: derive }),
}));

beforeEach(() => {
  Object.assign(Platform, { OS: 'ios', Version: '18.3', isMacCatalyst: true });
  derive.mockReset();
});
it('distinguishes a real Mac Catalyst runtime from an iPhone and Android', () => {
  expect(isMac()).toBe(true);
  Object.assign(Platform, { isMacCatalyst: false });
  expect(isMac()).toBe(false);
  Object.assign(Platform, { OS: 'android', isMacCatalyst: true });
  expect(isMac()).toBe(false);
});
it('derives a native Apple backup key instead of treating the OS version as an Android API level', async () => {
  derive.mockResolvedValue('ab'.repeat(32));
  expect(await nativePasswordKey('ä🔑', new Uint8Array(16), 600000)).toEqual(
    new Uint8Array(32).fill(0xab),
  );
  expect(derive).toHaveBeenCalledWith('ä🔑', '00'.repeat(16), 600000);
});
it('accepts confirmed Apple notifications without offering Android alarm repairs', () => {
  const reminder = {
    ...defaultReminder(),
    deliveryMode: 'punctualWithSound' as const,
  };
  const status: ReminderStatus = {
    notifications: true,
    exact: false,
    doNotDisturb: null,
    availability: { normal: 'available', punctualWithSound: 'available' },
    schedules: [
      {
        recordId: 'series',
        nextTriggerAtMillis: Date.now() + 3600000,
        planningState: 'scheduled',
        isExact: false,
        deliveryFailed: false,
        isNotificationActive: false,
        lastTriggeredAtMillis: null,
      },
    ],
  };
  expect(needsReminderRepair(reminder, status.schedules[0])).toBe(false);
  expect(reminderSaveWarning(reminder, status, 'series')).toBeNull();
  expect(reminderPresentation(reminder, status, 'series')?.action).toBeNull();
  expect(reminderModes().punctualWithSound.title).toBe('Mit Ton');
  expect(reminderTime(reminder)).not.toContain('pünktlich');
  expect(reminderTestMessage('posted', null)).not.toContain('Android');
  status.schedules[0]!.scheduledThroughMillis = Date.now() + 7200000;
  expect(
    reminderPresentation(reminder, status, 'series')?.description,
  ).toContain('Geplant bis');
  status.availability.punctualWithSound = 'appBlocked';
  expect(reminderSaveWarning(reminder, status, 'series')).toContain(
    'Systemeinstellungen',
  );
});
