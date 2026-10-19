import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Pressable, ScrollView, View } from 'react-native';
import {
  StartupError,
  StartupProvider,
  useStartupHold,
  useStartupLayout,
} from '../src/core/startup/startup';

const native = vi.hoisted(() => ({
  hide: vi.fn(),
  background: vi.fn().mockResolvedValue(undefined),
  preventAutoHideAsync: vi.fn().mockResolvedValue(undefined),
  setOptions: vi.fn(),
}));
vi.mock('react-native', () => ({
  Image: 'Image',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('expo-splash-screen', () => native);
vi.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: native.background,
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// Vitest clears mock call histories before each test. Capture module startup.
const splashWasHeld = native.preventAutoHideAsync.mock.calls.length === 1;
const splashOptions = native.setOptions.mock.calls.at(-1)?.[0];
let renderer: ReactTestRenderer | undefined;

function InitialPage({
  ready,
  nestedLoading,
}: {
  ready: boolean;
  nestedLoading: boolean;
}) {
  useStartupHold(nestedLoading);
  const onLayout = useStartupLayout(ready, '#0C0C0F');
  return createElement(View, { testID: 'initial-page', onLayout });
}
function app(ready: boolean, nestedLoading = false) {
  return createElement(
    StartupProvider,
    null,
    createElement(InitialPage, { ready, nestedLoading }),
  );
}
beforeEach(() => {
  native.hide.mockClear();
  native.background.mockClear();
  vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

it('holds the splash until data, layout and nested content are ready, only on the first screen', async () => {
  expect(splashWasHeld).toBe(true);
  expect(splashOptions).toEqual({ duration: 180, fade: true });
  await act(async () => {
    renderer = create(app(false, true));
  });
  await act(async () =>
    renderer!.root.findByProps({ testID: 'initial-page' }).props.onLayout(),
  );
  expect(native.hide).not.toHaveBeenCalled();
  await act(async () => renderer!.update(app(true, true)));
  expect(native.hide).not.toHaveBeenCalled();
  await act(async () => renderer!.update(app(true)));
  expect(native.background).toHaveBeenCalledWith('#0C0C0F');
  expect(native.hide).toHaveBeenCalledOnce();
  await act(async () => renderer!.update(app(false, true)));
  await act(async () => renderer!.update(app(true)));
  expect(native.hide).toHaveBeenCalledOnce();
});

it('reveals a recoverable startup error and leaves retry available', async () => {
  const retry = vi.fn();
  await act(async () => {
    renderer = create(
      createElement(
        StartupProvider,
        null,
        createElement(StartupError, {
          message: 'Datenbank nicht verfügbar.',
          retry,
        }),
      ),
    );
  });
  expect(native.hide).not.toHaveBeenCalled();
  await act(async () => renderer!.root.findByType(ScrollView).props.onLayout());
  expect(native.hide).toHaveBeenCalledOnce();
  expect(
    renderer!.root.findByProps({ accessibilityRole: 'alert' }).props.children,
  ).toBe('Datenbank nicht verfügbar.');
  await act(async () => renderer!.root.findByType(Pressable).props.onPress());
  expect(retry).toHaveBeenCalledOnce();
});
