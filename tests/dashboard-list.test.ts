import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createContext, createElement, Fragment, type ReactNode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { RecordsScreen } from '../src/features/records/record-screens';
import type { DashboardItem } from '../src/features/records/presentation-model';
import { fixture, record } from './support';

const ports = vi.hoisted(() => ({ push: vi.fn(), choose: vi.fn() }));
type ListProps = {
  data: DashboardItem[];
  keyExtractor(item: DashboardItem): string;
  renderItem(info: { item: DashboardItem; index: number }): ReactNode;
  ListHeaderComponent: ReactNode;
  ListEmptyComponent: ReactNode;
};
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  useWindowDimensions: () => ({ fontScale: 1 }),
  // Render a small viewport. The test checks app data and component lifetime,
  // not React Native's own virtualization implementation or frame rate.
  FlatList: (props: ListProps) =>
    createElement(
      'FlatList',
      props,
      props.ListHeaderComponent,
      props.data.length
        ? props.data
            .slice(0, 2)
            .map((item, index) =>
              createElement(
                Fragment,
                { key: props.keyExtractor(item) },
                props.renderItem({ item, index }),
              ),
            )
        : props.ListEmptyComponent,
    ),
}));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
}));
vi.mock('expo-router', async () => {
  const React = await import('react');
  return {
    router: { push: ports.push },
    Stack: { Screen: 'Screen' },
    useLocalSearchParams: () => ({}),
    useFocusEffect: (callback: () => () => void) => {
      const focused = React.useContext(focusContext);
      React.useEffect(
        () => (focused ? callback() : undefined),
        [callback, focused],
      );
    },
  };
});
vi.mock('../src/core/ui/components', () => ({
  Body: 'Body',
  Button: 'Button',
  Busy: 'Busy',
  Card: 'Card',
  Field: 'Field',
  Heading: 'Heading',
  Title: 'Title',
  Fab: 'Fab',
  IconButton: 'IconButton',
  Notice: 'Notice',
  Page: (props: { children: ReactNode; fab: ReactNode; scroll: boolean }) =>
    createElement('Page', { scroll: props.scroll }, props.children, props.fab),
  useTheme: () => ({ primary: '#006b63', ink: '#111', background: '#fff' }),
  errorText: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));
vi.mock('../src/core/ui/icon', () => ({
  Icon: 'Icon',
  categoryIcon: () => 'live_tv',
}));
vi.mock('../src/features/records/series-cover', () => ({
  SeriesCover: 'SeriesCover',
}));
vi.mock('../src/core/ui/feedback', () => ({ useFeedback: () => ports }));
vi.mock('../src/features/records/reports', () => ({ Reports: 'Reports' }));
vi.mock('../src/features/records/history-tile', () => ({
  HistoryTile: 'HistoryTile',
}));
vi.mock('../src/features/records/reminder-status', () => ({
  ReminderScheduleStatus: 'ReminderScheduleStatus',
}));
vi.mock('../src/features/records/use-reminder-status', () => ({
  useReminderStatus: () => undefined,
}));
vi.mock('../src/core/composition', () => ({
  useServices: () => ({ series: f.series, revision: 0 }),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const focusContext = createContext(true);
let f: Awaited<ReturnType<typeof fixture>>;
let renderer: ReactTestRenderer | undefined;
const root = () => renderer!.root;
const list = () => root().findByType('FlatList' as never);
const field = () => root().findByType('Field' as never);
const text = () =>
  root()
    .findAllByType('Body' as never)
    .map((node) => node.children.join(''))
    .join('\n');
function Harness({ focused }: { focused: boolean }) {
  return createElement(
    focusContext.Provider,
    { value: focused },
    createElement(RecordsScreen),
  );
}
async function mount() {
  await act(async () => {
    renderer = create(createElement(Harness, { focused: true }));
  });
}
async function focus(focused: boolean) {
  await act(async () => renderer!.update(createElement(Harness, { focused })));
}
async function search(value: string) {
  await act(async () => field().props.onChangeText(value));
}
async function press(title: string) {
  await act(async () => root().findByProps({ title }).props.onPress());
}
beforeEach(async () => {
  vi.clearAllMocks();
  f = await fixture();
  for (let index = 0; index < 24; index++) {
    const timestamp = new Date(Date.UTC(2026, 0, 1, 10, index)).toISOString();
    const r = record({
      name: `Serie ${String(index + 1).padStart(2, '0')}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    r.category = index === 0 ? 'Action' : index % 2 ? 'Thriller' : 'Drama';
    await f.repo.saveRecord(r);
  }
});
afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  vi.restoreAllMocks();
  await f.close();
});

it('keeps every series searchable and globally sorted beyond the visible viewport without page controls', async () => {
  await mount();
  expect(list().props.data).toHaveLength(24);
  expect(text()).toContain('24 Serien');
  expect(root().findByType('Page' as never).props.scroll).toBe(false);
  const input = field();
  expect(
    list()
      .props.data.slice(0, 10)
      .some((item: DashboardItem) => item.record.name === 'Serie 01'),
  ).toBe(false);
  await search('Serie 01');
  expect(field()).toBe(input);
  expect(text()).toContain('1 Treffer');
  expect(list().props.data[0].record.name).toBe('Serie 01');
  await search('nicht vorhanden');
  expect(text()).toContain('Keine passenden Serien gefunden.');
  expect(field()).toBe(input);
  await act(async () => field().props.onTrailingPress());
  expect(list().props.data).toHaveLength(24);
  ports.choose.mockResolvedValueOnce('name');
  await press('Zuletzt bearbeitet');
  const named = list().props.data as DashboardItem[];
  expect(named.map((item) => item.record.name)).toEqual(
    Array.from(
      { length: 24 },
      (_, index) => `Serie ${String(index + 1).padStart(2, '0')}`,
    ),
  );
  expect(
    new Set(named.map((item) => list().props.keyExtractor(item))).size,
  ).toBe(24);
  expect(list().props.keyExtractor(named[0])).toBe(named[0]!.record.id);
  await act(async () =>
    root()
      .findAllByType('Card' as never)[0]!
      .props.onPress(),
  );
  expect(ports.push).toHaveBeenCalledWith({
    pathname: '/record/[id]',
    params: { id: named[0]!.record.id },
  });
  ports.choose.mockResolvedValueOnce('category');
  await press('Titel');
  expect(list().props.data[0].record.category).toBe('Action');
  expect(list().props.data.at(-1).record.category).toBe('Thriller');
  expect(field()).toBe(input);
  expect(root().findAllByProps({ label: 'Nächste Seite' })).toHaveLength(0);
  expect(root().findAllByProps({ title: 'Serie anlegen' })).toHaveLength(1);
});

it('preserves list and search instances while refocusing, refreshing data and retrying a background failure', async () => {
  await mount();
  await search('Serie');
  const initialList = list();
  const input = field();
  await focus(false);
  const originalDashboard = f.repo.dashboard.bind(f.repo);
  let resolve!: (rows: DashboardItem[]) => void;
  const pending = new Promise<DashboardItem[]>((done) => {
    resolve = done;
  });
  const query = vi.spyOn(f.repo, 'dashboard').mockReturnValueOnce(pending);
  await focus(true);
  expect(list()).toBe(initialList);
  expect(root().findAllByType('Busy' as never)).toHaveLength(0);
  const updated = (await f.repo.records())[0]!;
  await f.repo.saveRecord({ ...updated, name: 'Serie aktualisiert' });
  await act(async () => resolve(await originalDashboard()));
  expect(
    list().props.data.some(
      (item: DashboardItem) => item.record.name === 'Serie aktualisiert',
    ),
  ).toBe(true);
  expect(list()).toBe(initialList);
  expect(field()).toBe(input);
  expect(field().props.value).toBe('Serie');
  query.mockRejectedValueOnce(new Error('Laden fehlgeschlagen'));
  await focus(false);
  await focus(true);
  expect(root().findByProps({ text: 'Laden fehlgeschlagen' }).props.error).toBe(
    true,
  );
  expect(list()).toBe(initialList);
  await press('Erneut laden');
  expect(root().findAllByProps({ text: 'Laden fehlgeschlagen' })).toHaveLength(
    0,
  );
  expect(field()).toBe(input);
});

it('retains initial load errors, retry and the first-series empty state', async () => {
  vi.spyOn(f.repo, 'dashboard')
    .mockRejectedValueOnce(new Error('Anfangsfehler'))
    .mockResolvedValueOnce([]);
  await mount();
  expect(root().findByProps({ text: 'Anfangsfehler' }).props.error).toBe(true);
  expect(root().findAllByType('FlatList' as never)).toHaveLength(0);
  await press('Erneut laden');
  expect(root().findAllByProps({ text: 'Anfangsfehler' })).toHaveLength(0);
  expect(root().findByType('Title' as never).props.children).toBe(
    'Erste Serie anlegen',
  );
  await press('Serie anlegen');
  expect(ports.push).toHaveBeenCalledWith('/record/edit');
});
