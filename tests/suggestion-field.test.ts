import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createElement, useState } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Pressable, ScrollView } from 'react-native';
import { Field } from '../src/core/ui/components';
import { SuggestionField } from '../src/core/ui/suggestion-field';
import { ScrollContext } from '../src/core/ui/scroll-host';
import { PageOverlayHost } from '../src/core/ui/page-overlay';
import { suggestionLayout } from '../src/core/ui/suggestion-layout';

const ports = vi.hoisted(() => ({
  keyboardTop: undefined as number | undefined,
  fieldTop: 400,
  viewportChanged: undefined as (() => void) | undefined,
  back: undefined as (() => boolean) | undefined,
  opened: vi.fn(),
  listeners: new Map<
    string,
    (event: { endCoordinates: { screenY: number } }) => void
  >(),
  dismiss: vi.fn(),
  changed: vi.fn(),
}));
vi.mock('react-native', () => ({
  BackHandler: {
    addEventListener: (_event: string, callback: () => boolean) => {
      ports.back = callback;
      return {
        remove: () => {
          ports.back = undefined;
        },
      };
    },
  },
  View: 'View',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  StyleSheet: { absoluteFill: { position: 'absolute' } },
  useWindowDimensions: () => ({ width: 360, height: 800, fontScale: 1 }),
  Keyboard: {
    metrics: () =>
      ports.keyboardTop === undefined
        ? undefined
        : { screenY: ports.keyboardTop },
    dismiss: ports.dismiss,
    addListener: (event: string, callback: () => void) => {
      ports.listeners.set(event, callback);
      return { remove: () => ports.listeners.delete(event) };
    },
  },
}));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 20, left: 0, right: 0 }),
}));
vi.mock('../src/core/ui/components', () => ({
  Body: 'Body',
  Field: 'Field',
  useTheme: () => ({ card: '#fff', overlayBorder: '#63343A' }),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let renderer: ReactTestRenderer | undefined;
const host = {
  subscribe(callback: () => void) {
    ports.viewportChanged = callback;
    return () => {
      ports.viewportChanged = undefined;
    };
  },
  ref: {
    current: {
      getNativeScrollRef: () => ({
        measureInWindow: (
          callback: (
            x: number,
            y: number,
            width: number,
            height: number,
          ) => void,
        ) => callback(0, 88, 360, 600),
      }),
    },
  },
} as unknown as NonNullable<React.ContextType<typeof ScrollContext>>;

function Harness() {
  const [value, setValue] = useState('Drama');
  return createElement(
    PageOverlayHost,
    null,
    createElement(
      ScrollContext.Provider,
      { value: host },
      createElement(SuggestionField, {
        label: 'Genre *',
        helper: 'Vorschlag auswählen oder eigenes Genre eingeben.',
        value,
        suggestions: ['Drama', 'Comedy', 'Krimi', 'Dokumentation', 'Fantasy'],
        showAllOnFocus: true,
        onOpenChange: ports.opened,
        onChange: (next) => {
          ports.changed(next);
          setValue(next);
        },
      }),
    ),
  );
}
async function mount() {
  await act(async () => {
    renderer = create(createElement(Harness), {
      createNodeMock: (node) => ({
        measureInWindow: (
          callback: (
            x: number,
            y: number,
            width: number,
            height: number,
          ) => void,
        ) =>
          (node.props as { style?: { flex?: number } }).style?.flex === 1
            ? callback(0, 88, 360, 712)
            : callback(16, ports.fieldTop, 328, 56),
      }),
    });
  });
  await act(async () => renderer!.root.findByType(Field).props.onFocus());
}

beforeEach(() => {
  ports.keyboardTop = undefined;
  ports.fieldTop = 400;
  ports.listeners.clear();
  vi.clearAllMocks();
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

it('keeps suggestions below when they fit, including for a field near the top', () => {
  expect(
    suggestionLayout({ top: 120, height: 56 }, { top: 88, bottom: 700 }, 220),
  ).toEqual({ above: false, maxHeight: 220 });
});

it('opens above a low field without extending into the keyboard', () => {
  expect(
    suggestionLayout({ top: 410, height: 56 }, { top: 88, bottom: 500 }, 220),
  ).toEqual({ above: true, maxHeight: 220 });
});

it('limits the scrollable list to the larger visible side in a short viewport', () => {
  expect(
    suggestionLayout({ top: 230, height: 56 }, { top: 88, bottom: 330 }, 220),
  ).toEqual({ above: true, maxHeight: 130 });
  expect(
    suggestionLayout({ top: 100, height: 56 }, { top: 88, bottom: 330 }, 220),
  ).toEqual({ above: false, maxHeight: 162 });
});

it('uses room below for a short filtered list and hides one with no visible room', () => {
  expect(
    suggestionLayout({ top: 400, height: 56 }, { top: 88, bottom: 550 }, 54),
  ).toEqual({ above: false, maxHeight: 54 });
  expect(
    suggestionLayout({ top: 88, height: 56 }, { top: 88, bottom: 144 }, 220),
  ).toEqual({ above: false, maxHeight: 0 });
});

it('repositions an open list when the keyboard appears and selects with one tap', async () => {
  await mount();
  const root = renderer!.root;
  expect(root.findByType(ScrollView).props.style.top).toBeDefined();
  await act(async () => {
    ports.keyboardTop = 500;
    ports.listeners.get('keyboardDidShow')!({
      endCoordinates: { screenY: 500 },
    });
  });
  expect(root.findByType(ScrollView).props.style.bottom).toBeDefined();
  expect(root.findByType(ScrollView).props.keyboardShouldPersistTaps).toBe(
    'handled',
  );
  await act(async () =>
    root.findAllByProps({ accessibilityRole: 'button' })[1]!.props.onPress(),
  );
  expect(ports.changed).toHaveBeenLastCalledWith('Comedy');
  expect(ports.dismiss).toHaveBeenCalledOnce();
  expect(root.findAllByType(ScrollView)).toHaveLength(0);
  expect(ports.listeners.size).toBe(0);
});

it('measures an already open keyboard and preserves filtering and custom genres', async () => {
  ports.keyboardTop = 500;
  await mount();
  const root = renderer!.root;
  expect(root.findByType(ScrollView).props.style.bottom).toBeDefined();
  await act(async () => root.findByType(Field).props.onChangeText('m'));
  expect(root.findAllByProps({ accessibilityRole: 'button' })).toHaveLength(4);
  await act(async () =>
    root.findByType(Field).props.onChangeText('Eigene Kategorie'),
  );
  expect(ports.changed).toHaveBeenLastCalledWith('Eigene Kategorie');
  expect(root.findByType(Field).props.value).toBe('Eigene Kategorie');
  expect(root.findAllByType(ScrollView)).toHaveLength(0);
  expect(ports.dismiss).not.toHaveBeenCalled();
});

it('keeps the list outside the form and follows viewport changes without moving form inputs', async () => {
  await mount();
  const root = renderer!.root;
  const list = root.findByType(ScrollView);
  expect(list.findAllByType(Field)).toHaveLength(0);
  expect(list.props.style.borderColor).toBe('#63343A');
  const oldTop = list.props.style.top;
  await act(async () => {
    ports.fieldTop -= 60;
    ports.viewportChanged!();
  });
  expect(root.findByType(ScrollView).props.style.top).toBe(oldTop - 60);
  await act(async () => {
    ports.fieldTop = 800;
    ports.viewportChanged!();
  });
  expect(root.findAllByType(ScrollView)).toHaveLength(0);
  await act(async () => {
    ports.fieldTop = 120;
    ports.viewportChanged!();
  });
  expect(root.findByType(ScrollView).props.style.maxHeight).toBe(220);
});

it('consumes outside taps, keeps the input uncovered and releases the form', async () => {
  await mount();
  const root = renderer!.root;
  expect(ports.opened).toHaveBeenLastCalledWith(true);
  const outside = root
    .findAllByType(Pressable)
    .filter((node) => node.props.accessible === false);
  expect(outside).toHaveLength(4);
  // The four outside regions leave the anchor (16, 312, 328, 56) interactive.
  expect(outside[0]!.props.style.height).toBe(312);
  expect(outside[1]!.props.style.top).toBe(368);
  await act(async () => outside[1]!.props.onPress());
  expect(ports.changed).not.toHaveBeenCalled();
  expect(ports.dismiss).toHaveBeenCalledOnce();
  expect(ports.opened).toHaveBeenLastCalledWith(false);
  expect(root.findAllByType(ScrollView)).toHaveLength(0);
  expect(ports.viewportChanged).toBeUndefined();
});

it('closes on Android Back and on keyboard dismissal without choosing a genre', async () => {
  await mount();
  await act(async () => {
    expect(ports.back!()).toBe(true);
  });
  expect(renderer!.root.findAllByType(ScrollView)).toHaveLength(0);
  await act(async () => renderer!.root.findByType(Field).props.onFocus());
  await act(async () =>
    ports.listeners.get('keyboardDidHide')!({
      endCoordinates: { screenY: 800 },
    }),
  );
  expect(renderer!.root.findAllByType(ScrollView)).toHaveLength(0);
  expect(ports.changed).not.toHaveBeenCalled();
  expect(ports.opened).toHaveBeenLastCalledWith(false);
  expect(ports.back).toBeUndefined();
  expect(ports.dismiss).toHaveBeenCalledTimes(2);
  await act(async () => renderer!.root.findByType(Field).props.onFocus());
  expect(renderer!.root.findAllByType(ScrollView)).toHaveLength(1);
});
