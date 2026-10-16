import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';
import { SettingsScreen } from '../src/features/settings/settings-screen';
import { fixture, record } from './support';

const ports = vi.hoisted(() => ({
  dismissKeyboard: vi.fn(),
  refresh: vi.fn(),
  openLink: vi.fn(),
  media: {
    prepareBackup: vi.fn(),
    saveBackup: vi.fn(),
    shareBackup: vi.fn(),
    discardBackup: vi.fn(),
    pickBackup: vi.fn(),
  },
  feedback: { choose: vi.fn(), confirm: vi.fn(), notify: vi.fn() },
}));
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));
vi.mock('react-native', () => ({
  Keyboard: { dismiss: ports.dismissKeyboard },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
}));
vi.mock('../src/core/ui/theme', () => ({
  useTheme: () => ({ primary: '#E50914', ink: '#181C20' }),
}));
vi.mock('../src/core/ui/components', () => ({
  Body: 'Body',
  Button: 'Button',
  BusyOverlay: 'BusyOverlay',
  Card: 'Card',
  Field: 'Field',
  Heading: 'Heading',
  Page: 'Page',
  Notice: (props: { text: string }) =>
    props.text ? createElement('Notice', props) : null,
  useTheme: () => ({ primary: '#E50914', ink: '#181C20' }),
  errorText: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));
vi.mock('../src/core/ui/icon', () => ({ Icon: 'Icon' }));
vi.mock('../src/core/ui/use-leave-guard', () => ({ useLeaveGuard: () => {} }));
vi.mock('../src/core/ui/feedback', () => ({
  useFeedback: () => ports.feedback,
}));
vi.mock('../src/core/composition', () => ({
  useServices: () => ({
    backup: active.backup,
    media: ports.media,
    refresh: ports.refresh,
    links: { open: ports.openLink },
  }),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type Fixture = Awaited<ReturnType<typeof fixture>>;
let active: Fixture;
let saved: Uint8Array;
let renderer: ReactTestRenderer | undefined;
const fixtures: Fixture[] = [];
const password = 'Test26';
const prepared = { uri: 'file:///test/backup.slbackup', name: 'Test.slbackup' };
const host = (name: string) => (node: ReactTestInstance) => node.type === name;
const root = () => renderer!.root;
const button = (label: string) =>
  root()
    .findAll(host('Pressable'))
    .find((node) =>
      node
        .findAll((n) => host('Text')(n) || host('Body')(n))
        .some((n) => n.children.join('') === label),
    )!;
const press = async (label: string) => {
  const node = button(label);
  expect(node.props.disabled).not.toBe(true);
  await act(async () => node.props.onPress());
};
const fill = async (label: string, value: string) => {
  await act(async () =>
    root().findByProps({ label }).props.onChangeText(value),
  );
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function mount() {
  if (renderer) await act(async () => renderer!.unmount());
  await act(async () => {
    renderer = create(createElement(SettingsScreen));
  });
}
async function setup() {
  const f = await fixture();
  fixtures.push(f);
  return f;
}
async function settled(assertion: () => void) {
  await vi.waitFor(
    async () => {
      await act(async () => {});
      assertion();
    },
    { timeout: 10000 },
  );
}
beforeEach(async () => {
  vi.resetAllMocks();
  active = await setup();
  await active.series.saveRecord(record());
  ports.media.prepareBackup.mockImplementation(async (bytes: Uint8Array) => {
    saved = bytes;
    return prepared;
  });
  ports.media.saveBackup.mockResolvedValue('saved');
  ports.media.discardBackup.mockResolvedValue(undefined);
  ports.media.pickBackup.mockImplementation(async () => saved);
  ports.feedback.choose.mockResolvedValue('done');
  ports.feedback.confirm.mockResolvedValue(true);
  ports.openLink.mockResolvedValue(undefined);
  await mount();
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  vi.restoreAllMocks();
  for (const f of fixtures.splice(0)) await f.close();
});

it('keeps password errors outside the scroller and accepts corrected input through the keyboard action', async () => {
  await press('Verschlüsseltes Backup erstellen');
  const modal = root().find(host('Modal'));
  for (let parent = modal.parent; parent; parent = parent.parent)
    expect(parent.type).not.toBe('Page');
  await fill('Passwort', '12345');
  await fill('Passwort wiederholen', '12345');
  await press('Weiter');
  const notice = root().find(host('Notice'));
  expect(notice.props.text).toContain('6 bis 1024');
  for (let parent = notice.parent; parent; parent = parent.parent)
    expect(parent.type).not.toBe('ScrollView');
  expect(ports.dismissKeyboard).toHaveBeenCalled();
  expect(ports.media.prepareBackup).not.toHaveBeenCalled();
  await fill('Passwort', password);
  await press('Weiter');
  expect(root().find(host('Notice')).props.text).toContain('nicht überein');
  await fill('Passwort wiederholen', password);
  expect(root().findAll(host('Notice'))).toHaveLength(0);
  await act(async () =>
    root()
      .findByProps({ label: 'Passwort wiederholen' })
      .props.onSubmitEditing(),
  );
  await settled(() => expect(ports.media.discardBackup).toHaveBeenCalledOnce());
  expect(ports.media.saveBackup).toHaveBeenCalledWith(prepared);
  expect(root().findAll(host('Modal'))).toHaveLength(0);
});

it('round trips the screen flow and rejects a wrong password or cancelled restore before changing SQLite', async () => {
  const before = await active.repo.snapshot();
  await press('Verschlüsseltes Backup erstellen');
  await fill('Passwort', password);
  await fill('Passwort wiederholen', password);
  await press('Weiter');
  await settled(() => expect(ports.media.discardBackup).toHaveBeenCalledOnce());
  active = await setup();
  await mount();
  await press('Backup wiederherstellen');
  await fill('Passwort', 'wrong-password');
  await press('Weiter');
  await settled(() =>
    expect(root().find(host('Notice')).props.text).toContain(
      'Passwort ist falsch',
    ),
  );
  expect(ports.feedback.confirm).not.toHaveBeenCalled();
  expect((await active.repo.snapshot()).records).toEqual([]);
  ports.feedback.confirm.mockResolvedValueOnce(false);
  await press('Backup wiederherstellen');
  await fill('Passwort', password);
  await press('Weiter');
  await settled(() => expect(ports.feedback.confirm).toHaveBeenCalledOnce());
  expect((await active.repo.snapshot()).records).toEqual([]);
  await press('Backup wiederherstellen');
  await fill('Passwort', password);
  await press('Weiter');
  await settled(() => expect(ports.refresh).toHaveBeenCalledOnce());
  expect((await active.repo.snapshot()).records).toEqual(before.records);
  expect(ports.feedback.notify).toHaveBeenCalledWith(
    expect.stringContaining('Backup wiederhergestellt'),
  );
});

it.each(['retry', 'discard'])(
  'handles save cancellation with %s and cleans only the prepared copy',
  async (action) => {
    ports.media.saveBackup.mockResolvedValueOnce('cancelled');
    ports.feedback.choose.mockResolvedValueOnce(action);
    await press('Verschlüsseltes Backup erstellen');
    await fill('Passwort', password);
    await fill('Passwort wiederholen', password);
    await press('Weiter');
    await settled(() =>
      expect(ports.media.discardBackup).toHaveBeenCalledOnce(),
    );
    expect(ports.media.prepareBackup).toHaveBeenCalledOnce();
    expect(ports.media.saveBackup).toHaveBeenCalledTimes(
      action === 'retry' ? 2 : 1,
    );
    expect(ports.media.discardBackup).toHaveBeenCalledWith(prepared);
    expect((await active.repo.snapshot()).records).toHaveLength(1);
  },
);

it('reuses the prepared encrypted file after a save error and shares it before cleanup', async () => {
  ports.media.saveBackup.mockRejectedValueOnce(
    new Error('SYNTHETIC_SAVE_FAILURE'),
  );
  ports.feedback.choose
    .mockResolvedValueOnce('retry')
    .mockResolvedValueOnce('share');
  await press('Verschlüsseltes Backup erstellen');
  await fill('Passwort', password);
  await fill('Passwort wiederholen', password);
  await press('Weiter');
  await settled(() => expect(ports.media.discardBackup).toHaveBeenCalledOnce());
  expect(ports.media.prepareBackup).toHaveBeenCalledOnce();
  expect(ports.media.saveBackup.mock.calls).toEqual([[prepared], [prepared]]);
  expect(ports.feedback.choose.mock.calls[0]![0].message).toBe(
    'SYNTHETIC_SAVE_FAILURE',
  );
  expect(ports.media.shareBackup).toHaveBeenCalledWith(prepared);
  expect(ports.media.shareBackup.mock.invocationCallOrder[0]).toBeLessThan(
    ports.media.discardBackup.mock.invocationCallOrder[0]!,
  );
  expect(root().find(host('BusyOverlay')).props.visible).toBe(false);
});

it('serializes repeated create taps and releases the operation after password cancellation', async () => {
  const start = button('Verschlüsseltes Backup erstellen');
  await act(async () => {
    start.props.onPress();
    start.props.onPress();
  });
  expect(button('Verschlüsseltes Backup erstellen').props.disabled).toBe(true);
  await press('Abbrechen');
  expect(button('Verschlüsseltes Backup erstellen').props.disabled).toBe(false);
  expect(ports.media.prepareBackup).not.toHaveBeenCalled();
  await press('Verschlüsseltes Backup erstellen');
  await press('Abbrechen');
  expect(root().findAll(host('Modal'))).toHaveLength(0);
});

it('shows file progress, encryption and export preparation while blocking duplicate operations', async () => {
  const checked = deferred<void>(),
    encrypted = deferred<void>();
  const preparedFile = deferred<typeof prepared>();
  const createBackup = vi
    .spyOn(active.backup, 'create')
    .mockImplementation(async (_password, report) => {
      report?.({ phase: 'checking', completedFiles: 3, totalFiles: 12 });
      await checked.promise;
      report?.({ phase: 'encrypting' });
      await encrypted.promise;
      return new Uint8Array([1, 2, 3]);
    });
  ports.media.prepareBackup.mockImplementation(() => preparedFile.promise);
  try {
    await press('Verschlüsseltes Backup erstellen');
    await fill('Passwort', password);
    await fill('Passwort wiederholen', password);
    await press('Weiter');
    expect(root().find(host('BusyOverlay')).props).toMatchObject({
      visible: true,
      label: 'Dateien werden geprüft · 3 von 12',
    });
    expect(button('Verschlüsseltes Backup erstellen').props.disabled).toBe(
      true,
    );
    expect(button('Backup wiederherstellen').props.disabled).toBe(true);
    await act(async () => checked.resolve());
    expect(root().find(host('BusyOverlay')).props.label).toBe(
      'Backup wird verschlüsselt …',
    );
    await act(async () => encrypted.resolve());
    await settled(() =>
      expect(ports.media.prepareBackup).toHaveBeenCalledOnce(),
    );
    expect(root().find(host('BusyOverlay')).props.label).toBe(
      'Speicherort wird vorbereitet …',
    );
    await act(async () => preparedFile.resolve(prepared));
    await settled(() =>
      expect(ports.media.discardBackup).toHaveBeenCalledOnce(),
    );
    expect(createBackup).toHaveBeenCalledOnce();
    expect(root().find(host('BusyOverlay')).props.visible).toBe(false);
    expect(button('Verschlüsseltes Backup erstellen').props.disabled).toBe(
      false,
    );
  } finally {
    checked.resolve();
    encrypted.resolve();
    preparedFile.resolve(prepared);
  }
});

it('clears progress and unlocks backup actions after an encryption failure so the user can retry', async () => {
  const createBackup = vi.spyOn(active.backup, 'create');
  createBackup.mockImplementationOnce(async (_password, report) => {
    report?.({ phase: 'encrypting' });
    throw new Error('SYNTHETIC_ENCRYPTION_FAILURE');
  });
  await press('Verschlüsseltes Backup erstellen');
  await fill('Passwort', password);
  await fill('Passwort wiederholen', password);
  await press('Weiter');
  await settled(() =>
    expect(root().find(host('Notice')).props.text).toContain(
      'SYNTHETIC_ENCRYPTION_FAILURE',
    ),
  );
  expect(root().find(host('BusyOverlay')).props.visible).toBe(false);
  expect(button('Verschlüsseltes Backup erstellen').props.disabled).toBe(false);
  expect(ports.media.prepareBackup).not.toHaveBeenCalled();
  expect(ports.media.saveBackup).not.toHaveBeenCalled();
  expect(ports.media.discardBackup).not.toHaveBeenCalled();
  await press('Verschlüsseltes Backup erstellen');
  await fill('Passwort', password);
  await fill('Passwort wiederholen', password);
  await press('Weiter');
  await settled(() => expect(ports.media.discardBackup).toHaveBeenCalledOnce());
  expect(createBackup).toHaveBeenCalledTimes(2);
});

it('shows decryption and restore progress and clears the overlay before restore confirmation', async () => {
  const decoded = await active.backup.codec.decode(
    await active.backup.create(password),
    password,
  );
  const decrypting = deferred<void>(),
    checking = deferred<void>(),
    restoring = deferred<void>();
  vi.spyOn(active.backup.codec, 'decode').mockImplementation(
    async (_bytes, _password, report) => {
      report?.({ phase: 'decrypting' });
      await decrypting.promise;
      report?.({ phase: 'checking', completedFiles: 2, totalFiles: 5 });
      await checking.promise;
      return decoded;
    },
  );
  const confirm = deferred<boolean>();
  ports.feedback.confirm.mockImplementation(() => confirm.promise);
  vi.spyOn(active.backup, 'restore').mockImplementation(
    async (_decoded, report) => {
      report?.({ phase: 'restoring', completedFiles: 1, totalFiles: 5 });
      await restoring.promise;
      return { warnings: [] };
    },
  );
  try {
    await press('Backup wiederherstellen');
    await fill('Passwort', password);
    await press('Weiter');
    expect(root().find(host('BusyOverlay')).props.label).toBe(
      'Backup wird entschlüsselt …',
    );
    await act(async () => decrypting.resolve());
    expect(root().find(host('BusyOverlay')).props.label).toBe(
      'Dateien werden geprüft · 2 von 5',
    );
    await act(async () => checking.resolve());
    expect(ports.feedback.confirm).toHaveBeenCalledOnce();
    expect(root().find(host('BusyOverlay')).props.visible).toBe(false);
    await act(async () => confirm.resolve(true));
    expect(root().find(host('BusyOverlay')).props.label).toBe(
      'Backup wird wiederhergestellt · 1 von 5',
    );
    await act(async () => restoring.resolve());
    expect(ports.refresh).toHaveBeenCalledOnce();
    expect(root().find(host('BusyOverlay')).props.visible).toBe(false);
  } finally {
    decrypting.resolve();
    checking.resolve();
    confirm.resolve(false);
    restoring.resolve();
  }
});
