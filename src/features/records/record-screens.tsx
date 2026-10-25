import { t, formatNumber } from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { FlatList, View, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Body,
  Button,
  Busy,
  Card,
  Field,
  Heading,
  Page,
  Title,
  Fab,
  IconButton,
  Notice,
  useTheme,
} from '../../core/ui/components';
import { Icon, categoryIcon } from '../../core/ui/icon';
import { useFeedback } from '../../core/ui/feedback';
import { useRecords, useRecordDetail } from './use-records';
import { ReminderScheduleStatus } from './reminder-status';
import { HistoryTile } from './history-tile';
import { Reports } from './reports';
import { SeriesCover } from './series-cover';
import {
  dateTime,
  entrySummary,
  reminderSummary,
  sortLabels,
  type RecordSort,
  type DashboardItem,
} from './presentation-model';
import { PAGE_SIZE, type SeriesRecord } from '../../core/domain/models';
import type { ReminderStatus } from '../../core/native/series-native';
export function ReminderInfo({
  record,
  status,
  onEdit,
}: {
  record: SeriesRecord;
  status?: ReminderStatus;
  onEdit(): void;
}) {
  useLocalization();
  const c = useTheme();
  const r = record.reminder;
  const s = status?.schedules.find((s) => s.recordId === record.id);
  if (!r && s?.planningState !== 'cancelFailed') return null;
  return (
    <View style={{ gap: 6 }}>
      {r && (
        <Body strong style={{ fontSize: 12 }}>
          {t('Erinnern:')} {reminderSummary(r)}
        </Body>
      )}
      <ReminderScheduleStatus
        reminder={r}
        status={status}
        recordId={record.id}
        onEdit={onEdit}
      />
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: c.soft,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Icon name="notifications_active_outlined" size={19} color={c.onSoft} />
        <Body strong style={{ fontSize: 12, color: c.onSoft, flex: 1 }}>
          {t('Letzte Erinnerung:')}{' '}
          {s?.lastTriggeredAtMillis
            ? t('{p0} Uhr', { p0: dateTime(s.lastTriggeredAtMillis) })
            : t('noch keine')}
        </Body>
      </View>
    </View>
  );
}
type DashboardHeaderProps = Pick<
  ReturnType<typeof useRecords>,
  'search' | 'setSearch' | 'sort' | 'setSort' | 'error' | 'retry'
> & {
  count: number;
};
// Keep the header type stable so typing never remounts the search input.
function DashboardHeader({
  search,
  setSearch,
  sort,
  setSort,
  count,
  error,
  retry,
}: DashboardHeaderProps) {
  useLocalization();
  const feedback = useFeedback();
  return (
    <View style={{ gap: 12, paddingBottom: 12 }}>
      {!!error && (
        <>
          <Notice error text={error} />
          <Button title={t('Erneut laden')} onPress={retry} />
        </>
      )}
      <Title subtitle={t('Dein nächster Serienabend beginnt hier.')}>
        {t('Deine Serien')}
      </Title>
      <View style={{ marginTop: 4 }}>
        <Field
          label={t('Serien suchen')}
          leading="search"
          value={search}
          onChangeText={setSearch}
          trailing={search ? 'close' : undefined}
          onTrailingPress={() => setSearch('')}
          returnKeyType="search"
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Body muted>
          {formatNumber(count)}{' '}
          {search ? t('Treffer') : count === 1 ? t('Serie') : t('Serien')}
        </Body>
        <Button
          secondary
          icon="sort"
          menu
          title={sortLabels()[sort]}
          onPress={(anchor) =>
            void feedback
              .choose({
                title: t('Serien sortieren'),
                anchor,
                options: (Object.keys(sortLabels()) as RecordSort[]).map(
                  (value) => ({
                    value,
                    label: sortLabels()[value],
                    icon: value === sort ? 'check' : undefined,
                  }),
                ),
              })
              .then((value) => {
                if (value) setSort(value as RecordSort);
              })
          }
        />
      </View>
    </View>
  );
}
function DashboardCard({
  item,
  hasDraft,
  status,
}: {
  item: DashboardItem;
  hasDraft: boolean;
  status?: ReminderStatus;
}) {
  useLocalization();
  const { record, latest, lastEdited, photo } = item;
  const c = useTheme();
  return (
    <Card
      style={{ padding: 0, gap: 0 }}
      onPress={() =>
        router.push({
          pathname: '/record/[id]',
          params: { id: record.id },
        })
      }
    >
      <SeriesCover photo={photo} title={record.name} />
      <View
        style={{
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c.primary + '1F',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={categoryIcon(record.category)} color={c.primary} />
          {status?.schedules.find((s) => s.recordId === record.id)
            ?.isNotificationActive && (
            <View
              style={{
                position: 'absolute',
                right: -2,
                top: -4,
                backgroundColor: c.danger,
                borderRadius: 10,
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ color: c.background, fontSize: 11 }}>1</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Body strong style={{ fontSize: 16, lineHeight: 24 }}>
            {record.name}
          </Body>
          <Body muted>{record.category}</Body>
          <Text
            style={{
              fontFamily: 'RobotoBlack',
              fontSize: 22,
              lineHeight: 28,
              color: c.ink,
              marginTop: 2,
            }}
          >
            {entrySummary(latest)}
          </Text>
          <Body muted style={{ fontSize: 12, lineHeight: 16 }}>
            {t('Zuletzt bearbeitet:')} {dateTime(lastEdited)}
          </Body>
          {hasDraft && (
            <Body muted style={{ fontSize: 12 }}>
              {t('Gesicherter Formularentwurf')}
            </Body>
          )}
          <ReminderInfo
            record={record}
            status={status}
            onEdit={() =>
              router.push({
                pathname: '/record/edit',
                params: { id: record.id },
              })
            }
          />
        </View>
        <Icon name="chevron_right" />
      </View>
    </Card>
  );
}
function SeriesSeparator() {
  useLocalization();
  return <View style={{ height: 12 }} />;
}
const dashboardKey = (item: DashboardItem) => item.record.id;
export function RecordsScreen() {
  useLocalization();
  const vm = useRecords(),
    c = useTheme(),
    safe = useSafeAreaInsets(),
    { fontScale } = useWindowDimensions();
  const create = () => router.push('/record/edit');
  const showList = !vm.loading && !vm.empty;
  return (
    <Page
      ready={!vm.loading}
      scroll={!showList}
      fab={<Fab title={t('Serie anlegen')} onPress={create} />}
    >
      {vm.loading ? (
        <Busy label={t('Serien werden geladen …')} />
      ) : vm.error && vm.empty ? (
        <>
          <Notice error text={vm.error} />
          <Button title={t('Erneut laden')} onPress={vm.retry} />
        </>
      ) : vm.empty ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
            gap: 20,
          }}
        >
          <Icon name="live_tv" size={72} color={c.primary} />
          <Title>{t('Erste Serie anlegen')}</Title>
          <Body style={{ textAlign: 'center' }}>
            {t(
              'Deine Serien. Dein Tempo. Halte fest, bei welcher Folge du bist, ergänze Bilder und Gedanken und lass dich ans Weiterschauen erinnern. Alles bleibt auf deinem Gerät.',
            )}
          </Body>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: Math.max(112, 56 * fontScale + 48) + safe.bottom,
            width: '100%',
            maxWidth: 800,
            alignSelf: 'center',
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          data={vm.items}
          keyExtractor={dashboardKey}
          ListHeaderComponent={
            <DashboardHeader
              search={vm.search}
              setSearch={vm.setSearch}
              sort={vm.sort}
              setSort={vm.setSort}
              count={vm.items.length}
              error={vm.error}
              retry={vm.retry}
            />
          }
          ListEmptyComponent={
            <Card>
              <Icon name="search" size={42} color={c.primary} />
              <Body>{t('Keine passenden Serien gefunden.')}</Body>
            </Card>
          }
          ItemSeparatorComponent={SeriesSeparator}
          renderItem={({ item }) => (
            <DashboardCard
              item={item}
              hasDraft={vm.drafts.some((d) => d.recordId === item.record.id)}
              status={vm.status}
            />
          )}
        />
      )}
    </Page>
  );
}
export function Pager({
  offset,
  total,
  onChange,
}: {
  offset: number;
  total: number;
  onChange(n: number): void;
}) {
  useLocalization();
  return total > PAGE_SIZE ? (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <IconButton
        icon="chevron_left"
        label={t('Vorherige Seite')}
        disabled={offset === 0}
        onPress={() => onChange(Math.max(0, offset - PAGE_SIZE))}
      />
      <Body>
        {t('Seite')} {formatNumber(Math.floor(offset / PAGE_SIZE) + 1)}{' '}
        {t('von')} {formatNumber(Math.ceil(total / PAGE_SIZE))}
      </Body>
      <IconButton
        icon="chevron_right"
        label={t('Nächste Seite')}
        disabled={offset + PAGE_SIZE >= total}
        onPress={() => onChange(offset + PAGE_SIZE)}
      />
    </View>
  ) : null;
}
export function RecordDetailScreen() {
  useLocalization();
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const vm = useRecordDetail(id),
    c = useTheme(),
    feedback = useFeedback();
  const r = vm.record;
  const edit = () => router.push({ pathname: '/record/edit', params: { id } });
  const capture = () =>
    router.push({ pathname: '/entry/edit', params: { recordId: id } });
  if (!r)
    return (
      <Page ready={!vm.loading}>
        <Notice error text={vm.error} />
        {vm.loading ? <Busy /> : <Body>{t('Serie nicht gefunden.')}</Body>}
      </Page>
    );
  return (
    <Page
      ready={!vm.loading}
      fab={
        <Fab
          title={t('Folgenstand erfassen')}
          icon="play_arrow"
          onPress={capture}
        />
      }
    >
      <Stack.Screen options={{ title: r.name }} />
      <SeriesCover photo={vm.photo} title={r.name} expandable />
      <Card onPress={edit} style={{ margin: 4, padding: 17, gap: 0 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c.primary + '1F',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={categoryIcon(r.category)} color={c.primary} />
          </View>
          <Body
            strong
            style={{
              flex: 1,
              fontSize: 16,
              lineHeight: 24,
              letterSpacing: 0.15,
            }}
          >
            {r.category || t('Serie')}
          </Body>
          <Icon name="chevron_right" color={c.muted} />
        </View>
        <Body
          style={{
            marginTop: 14,
            fontFamily: 'RobotoBlack',
            fontSize: 28,
            lineHeight: 36,
            letterSpacing: 0,
          }}
        >
          {entrySummary(vm.entries[0] ?? null)}
        </Body>
        {!!vm.entries[0] && (
          <Body>
            {t('Zuletzt am')} {dateTime(vm.entries[0].occurredAt)}
          </Body>
        )}
        <View style={{ marginTop: 10 }}>
          {!!r.note && <Body>{r.note}</Body>}
          <ReminderInfo record={r} status={vm.status} onEdit={edit} />
        </View>
      </Card>
      <View style={{ gap: 12 }}>
        <Button
          secondary
          icon="edit_outlined"
          title={t('Serie & Erinnerung bearbeiten')}
          onPress={edit}
        />
        <Button
          secondary
          danger
          icon="delete_outline"
          title={t('Serie löschen')}
          disabled={vm.busy}
          onPress={() =>
            void feedback
              .confirm(
                t('Serie löschen?'),
                t(
                  'Die Serie, ihre Folgenstände und gespeicherten Protokolle werden gelöscht. Exportierte Dateien bleiben erhalten.',
                ),
                t('Löschen'),
                true,
              )
              .then((ok) => {
                if (ok) void vm.remove();
              })
          }
        />
      </View>
      <Notice error text={vm.error} />
      {vm.total > 0 && (
        <Reports
          recordId={id}
          hasAttachments={vm.hasAttachments}
          summary={r.name}
        />
      )}
      <View style={{ marginTop: vm.total > 0 ? 6 : 18, gap: 8 }}>
        <Heading>{t('Serienverlauf')}</Heading>
        {vm.total > 0 && (
          <Body style={{ fontFamily: 'RobotoMedium', letterSpacing: 0.1 }}>
            {vm.total === 1
              ? t('1 Folgenstand')
              : t('{p0} von {p1} Folgenständen', {
                  p0: vm.entries.length,
                  p1: vm.total,
                })}
          </Body>
        )}
        {!vm.total && (
          <Card
            onPress={capture}
            style={{ margin: 4, padding: 23, gap: 0, alignItems: 'center' }}
          >
            <Icon name="play_arrow" size={44} color={c.primary} />
            <Body style={{ marginTop: 10, textAlign: 'center' }}>
              {t(
                'Noch kein Folgenstand. Speichere deine aktuelle Staffel und Folge, auf Wunsch mit einem Bild oder einer Notiz.',
              )}
            </Body>
            <View
              style={{
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Body
                strong
                style={{ color: c.primary, textAlign: 'center', flexShrink: 1 }}
              >
                {t('Ersten Folgenstand erfassen')}
              </Body>
              <Icon name="chevron_right" color={c.primary} />
            </View>
          </Card>
        )}
        <View style={{ gap: 10 }}>
          {vm.historyItems.map((item) => (
            <HistoryTile key={item.entry.id} item={item} />
          ))}
        </View>
      </View>
      {vm.total > PAGE_SIZE && (
        <Button
          secondary
          icon="manage_search_outlined"
          title={t('Alle Folgenstände anzeigen')}
          onPress={() =>
            router.push({ pathname: '/record/history', params: { id } })
          }
        />
      )}
    </Page>
  );
}
export function RecordHistoryScreen() {
  useLocalization();
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const vm = useRecordDetail(id, true),
    c = useTheme();
  return (
    <Page
      ready={!vm.loading}
      top={
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 12,
            backgroundColor: c.background,
          }}
        >
          <Body
            style={{
              fontFamily: 'RobotoMedium',
              fontSize: 16,
              lineHeight: 24,
              letterSpacing: 0.15,
            }}
          >
            {vm.record?.name ?? ''}
          </Body>
          <Field
            label={t('Datum, Staffel, Folge oder Notiz suchen')}
            leading="search"
            value={vm.search}
            onChangeText={vm.setSearch}
            trailing={vm.search ? 'close' : undefined}
            onTrailingPress={() => vm.setSearch('')}
          />
        </View>
      }
      bottom={
        <Pager offset={vm.offset} total={vm.total} onChange={vm.setOffset} />
      }
    >
      <Stack.Screen options={{ title: t('Serienverlauf') }} />
      <Notice error text={vm.error} />
      {vm.loading ? (
        <Busy />
      ) : (
        <View style={{ gap: 8 }}>
          <Body style={{ fontFamily: 'RobotoMedium', letterSpacing: 0.1 }}>
            {vm.total === 0
              ? t('Keine Folgenstände gefunden')
              : vm.total === 1
                ? vm.search.trim()
                  ? t('1 Treffer')
                  : t('1 Folgenstand')
                : t('{p0}–{p1} von {p2} {p3}', {
                    p0: vm.offset + 1,
                    p1: Math.min(vm.offset + PAGE_SIZE, vm.total),
                    p2: vm.total,
                    p3: vm.search.trim() ? t('Treffern') : t('Folgenständen'),
                  })}
          </Body>
          <View style={{ gap: 10 }}>
            {vm.historyItems.map((item) => (
              <HistoryTile key={item.entry.id} item={item} />
            ))}
          </View>
        </View>
      )}
    </Page>
  );
}
