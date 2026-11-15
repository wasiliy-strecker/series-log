import { localization, t } from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { Platform, View } from 'react-native';
import {
  Body,
  Button,
  Card,
  MaterialSwitch,
  Notice,
  SelectField,
  useTheme,
} from '../../core/ui/components';
import { Icon } from '../../core/ui/icon';
import { useMaterialDateTime } from '../../core/ui/material-date-time';
import type { Reminder } from '../../core/domain/models';
import type { ReminderStatus } from '../../core/native/series-native';
import { useReminderEditor } from './use-reminder-editor';
import {
  reminderIntervals,
  weekdays,
  reminderModes,
  reminderAvailability,
  nextHourlyTrigger,
  testReminderHint,
} from './reminder-model';
import { dateTime, reminderTime } from './presentation-model';
export function ReminderEditor(props: {
  reminder: Reminder | null;
  busy: boolean;
  onChange(value: Reminder | null): void;
  status?: ReminderStatus;
  refreshStatus(): Promise<ReminderStatus | undefined>;
  recordId: string | null;
  label: string;
  categoryLabel: string;
}) {
  useLocalization();
  const { reminder, status } = props;
  const c = useTheme(),
    picker = useMaterialDateTime(),
    vm = useReminderEditor(props);
  const availability = reminder
    ? reminderAvailability(status, reminder.deliveryMode)
    : 'unknown';
  const start = new Date(reminder?.startsAtMillis ?? 0);
  const timeText = (date: Date) =>
    date.toLocaleTimeString(localization().formatLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  async function pickDate() {
    const date = await picker.date(start);
    if (date) vm.setHourlyStart(date, start);
  }
  async function pickTime() {
    const current = reminder!.interval === 'hourly' ? start : new Date();
    if (reminder!.interval !== 'hourly')
      current.setHours(reminder!.hour, reminder!.minute, 0, 0);
    const time = await picker.time(current);
    if (time) {
      if (reminder!.interval === 'hourly') vm.setHourlyStart(start, time);
      else vm.patch({ hour: time.getHours(), minute: time.getMinutes() });
    }
  }
  return (
    <>
      {picker.dialog}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Body style={{ fontSize: 16 }}>
              {t('Ans Weiterschauen erinnern')}
            </Body>
            <Body muted>{t('Optional und nur lokal auf diesem Gerät')}</Body>
          </View>
          <MaterialSwitch
            label={t('Erinnerung aktivieren')}
            value={!!reminder}
            disabled={vm.disabled}
            onValueChange={vm.toggle}
          />
        </View>
        {reminder && (
          <View style={{ gap: 16 }}>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <SelectField
              label={t('Intervall')}
              value={reminder.interval}
              disabled={vm.disabled}
              options={Object.entries(reminderIntervals()).map(
                ([value, label]) => ({ value, label }),
              )}
              onChange={(value) => vm.interval(value as Reminder['interval'])}
            />
            {reminder.interval === 'yearly' && (
              <SelectField
                label={t('Monat')}
                value={String(reminder.month)}
                disabled={vm.disabled}
                options={Array.from({ length: 12 }, (_, i) => String(i + 1))}
                onChange={(value) => vm.patch({ month: Number(value) })}
              />
            )}
            {reminder.interval === 'weekly' && (
              <SelectField
                label={t('Wochentag')}
                value={String(reminder.day)}
                disabled={vm.disabled}
                options={weekdays().map((label, i) => ({
                  label,
                  value: String(i + 1),
                }))}
                onChange={(value) => vm.patch({ day: Number(value) })}
              />
            )}
            {(reminder.interval === 'monthly' ||
              reminder.interval === 'yearly') && (
              <SelectField
                label={t('Tag')}
                value={String(reminder.day)}
                disabled={vm.disabled}
                options={[
                  ...Array.from({ length: 28 }, (_, i) => i + 1),
                  ...(reminder.day > 28 ? [reminder.day] : []),
                ].map((day) => ({ value: String(day), label: day + '.' }))}
                onChange={(value) => vm.patch({ day: Number(value) })}
              />
            )}
            {reminder.interval === 'hourly' ? (
              <>
                <View style={{ gap: 4 }}>
                  <Body strong>{t('Startdatum')}</Body>
                  <Body>
                    {start.toLocaleDateString(localization().formatLocale)}
                  </Body>
                </View>
                <Button
                  secondary
                  icon="calendar_month_outlined"
                  title={t('Datum ändern')}
                  disabled={vm.disabled}
                  onPress={() => void pickDate()}
                />
                <View style={{ gap: 4 }}>
                  <Body strong>{t('Startzeit')}</Body>
                  <Body>{timeText(start)}</Body>
                </View>
                <Button
                  secondary
                  icon="schedule"
                  title={t('Uhrzeit ändern')}
                  disabled={vm.disabled}
                  onPress={() => void pickTime()}
                />
                <Body muted>
                  {t(
                    'Ab dem gewählten Start alle 60 Minuten. Nächste Erinnerung: ',
                  ) +
                    dateTime(nextHourlyTrigger(reminder.startsAtMillis)) +
                    t(' Uhr.')}
                </Body>
              </>
            ) : (
              <>
                <View style={{ gap: 4 }}>
                  <Body strong>{t('Uhrzeit')}</Body>
                  <Body>{reminderTime(reminder)}</Body>
                </View>
                <Button
                  secondary
                  icon="schedule"
                  title={t('Uhrzeit ändern')}
                  disabled={vm.disabled}
                  onPress={() => void pickTime()}
                />
              </>
            )}
            <Body strong>{t('Art der Erinnerung')}</Body>
            {(['normal', 'punctualWithSound'] as const).map((mode) => (
              <Card
                key={mode}
                onPress={
                  vm.disabled ? undefined : () => void vm.selectMode(mode)
                }
                style={{
                  borderColor:
                    reminder.deliveryMode === mode ? c.primary : c.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <Icon name={reminderModes()[mode].icon} color={c.primary} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Body strong>{reminderModes()[mode].title}</Body>
                    <Body muted>{reminderModes()[mode].description}</Body>
                  </View>
                  <Icon
                    name={
                      reminder.deliveryMode === mode
                        ? 'check_circle_outline'
                        : 'radio_button_unchecked'
                    }
                    color={reminder.deliveryMode === mode ? c.primary : c.muted}
                  />
                </View>
              </Card>
            ))}
            {Platform.OS === 'android' &&
              reminder.deliveryMode === 'punctualWithSound' &&
              status?.exact === false && (
                <Card style={{ backgroundColor: c.errorContainer }}>
                  <Body>
                    {t(
                      'Für pünktliche Erinnerungen muss Android „Alarme & Erinnerungen“ erlauben. Aktiviere die Freigabe, damit die Erinnerung zuverlässig zur gewählten Zeit mit Ton erscheint.',
                    )}
                  </Body>
                  <Button
                    secondary
                    icon="settings_outlined"
                    title={t('Alarme & Erinnerungen erlauben')}
                    disabled={vm.disabled}
                    onPress={() => void vm.selectMode('punctualWithSound')}
                  />
                </Card>
              )}
            {Platform.OS === 'android' && Number(Platform.Version) >= 31 && (
              <Button
                secondary
                icon="open_in_new"
                title={t('„Alarme & Erinnerungen“ öffnen')}
                disabled={vm.disabled}
                onPress={() => void vm.open('exact')}
              />
            )}
            {availability === 'appBlocked' ||
            availability === 'channelBlocked' ? (
              <Card style={{ backgroundColor: c.errorContainer }}>
                <Body strong>
                  {availability === 'appBlocked'
                    ? t('Benachrichtigungen sind ausgeschaltet')
                    : t('Diese Erinnerungsart ist ausgeschaltet')}
                </Body>
                <Body>
                  {availability === 'appBlocked'
                    ? t(
                        Platform.OS === 'ios'
                          ? 'appleRemindersBlocked'
                          : 'Erlaube Benachrichtigungen für SerienLog in den Android-Einstellungen, damit Erinnerungen angezeigt werden können.',
                      )
                    : t('Aktiviere die Benachrichtigungskategorie für „') +
                      reminderModes()[reminder.deliveryMode].title +
                      t('“ in den Android-Einstellungen.')}
                </Body>
                <Button
                  secondary
                  icon="settings_outlined"
                  title={t('Einstellungen öffnen')}
                  disabled={vm.disabled}
                  onPress={() =>
                    void vm.open(
                      availability === 'appBlocked'
                        ? 'notifications'
                        : 'channel',
                    )
                  }
                />
              </Card>
            ) : (
              status?.doNotDisturb === true && (
                <Card>
                  <Body strong>{t('„Nicht stören“ ist aktiv')}</Body>
                  <Body>
                    {reminder.deliveryMode === 'normal'
                      ? t(
                          'Normale Erinnerungen können ohne Ton oder eingeblendetes Banner erscheinen.',
                        )
                      : t(
                          'Ob ein Alarmton oder Banner erscheint, hängt von deinen „Nicht stören“-Einstellungen und der Alarmlautstärke ab.',
                        )}
                  </Body>
                  <Button
                    secondary
                    icon="settings_outlined"
                    title={t('Einstellungen öffnen')}
                    disabled={vm.disabled}
                    onPress={() => void vm.open('doNotDisturb')}
                  />
                </Card>
              )
            )}
            {availability === 'unknown' && (
              <Notice
                text={t(
                  'Der Erinnerungsstatus konnte nicht bestätigt werden. Du kannst die Daten trotzdem speichern.',
                )}
              />
            )}
            <Button
              secondary
              icon="notifications_active_outlined"
              title={
                vm.action === 'test'
                  ? t('Test-Erinnerung wird gesendet …')
                  : t('Erinnerung jetzt testen')
              }
              disabled={vm.disabled}
              onPress={() => void vm.test()}
            />
            <Body>{testReminderHint()}</Body>
          </View>
        )}
      </Card>
    </>
  );
}
