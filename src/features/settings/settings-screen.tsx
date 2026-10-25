import {
  t,
  languageNames,
  languages,
  setLocalization,
} from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { seriesNative } from '../../core/native/series-native';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button,
  BusyOverlay,
  Card,
  Field,
  Heading,
  Notice,
  Page,
  useTheme,
} from '../../core/ui/components';
import { Icon } from '../../core/ui/icon';
import { DialogActions } from '../../core/ui/dialog-actions';
import { useSettings } from './use-settings';
function PasswordDialog({
  confirm,
  close,
}: {
  confirm: boolean;
  close: (value: string | null) => void;
}) {
  useLocalization();
  const c = useTheme();
  const [password, setPassword] = useState(''),
    [repeat, setRepeat] = useState(''),
    [show, setShow] = useState(false),
    [error, setError] = useState('');
  function submit() {
    Keyboard.dismiss();
    if (
      !password ||
      (confirm && password.length < 6) ||
      password.length > 1024
    ) {
      setError(
        confirm
          ? t('Bitte ein Passwort mit 6 bis 1024 Zeichen eingeben.')
          : t('Bitte ein gültiges Passwort eingeben.'),
      );
      return;
    }
    if (confirm && password !== repeat) {
      setError(t('Die Passwörter stimmen nicht überein.'));
      return;
    }
    close(password);
  }
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(null)}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.overlayBorder,
            borderRadius: 28,
            padding: 24,
            gap: 16,
            maxHeight: '85%',
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: 'Roboto',
              fontSize: 24,
              lineHeight: 32,
              color: c.ink,
            }}
          >
            {confirm
              ? t('Backup-Passwort festlegen')
              : t('Backup-Passwort eingeben')}
          </Text>
          <ScrollView
            style={{ flexGrow: 0, flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16, paddingTop: 8 }}
          >
            <Body>
              {confirm
                ? t(
                    'Mindestens 6 Zeichen. Ohne dieses Passwort kann das Backup nicht wiederhergestellt werden.',
                  )
                : t('Gib das Passwort dieser SerienLog-Sicherung ein.')}
            </Body>
            <Field
              label={t('Passwort')}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              onSubmitEditing={confirm ? undefined : submit}
              returnKeyType={confirm ? undefined : 'done'}
              trailing={
                show ? 'visibility_off_outlined' : 'visibility_outlined'
              }
              onTrailingPress={() => setShow((v) => !v)}
            />
            {confirm && (
              <Field
                label={t('Passwort wiederholen')}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                value={repeat}
                onChangeText={(value) => {
                  setRepeat(value);
                  setError('');
                }}
                onSubmitEditing={submit}
                returnKeyType="done"
              />
            )}
          </ScrollView>
          <Notice error text={error} />
          <DialogActions
            actions={[
              { label: t('Abbrechen'), onPress: () => close(null) },
              {
                label: t('Weiter'),
                filled: true,
                onPress: submit,
              },
            ]}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function SettingsScreen() {
  const locale = useLocalization();
  const c = useTheme();
  const [prompt, setPrompt] = useState<{
    confirm: boolean;
    id: number;
  }>();
  const resolve = useRef<((value: string | null) => void) | null>(null);
  useEffect(() => () => resolve.current?.(null), []);
  const vm = useSettings(
    (confirm) =>
      new Promise((done) => {
        resolve.current = done;
        setPrompt({ confirm, id: Date.now() });
      }),
  );
  function close(value: string | null) {
    setPrompt(undefined);
    resolve.current?.(value);
    resolve.current = null;
  }
  return (
    <>
      <Page>
        <Notice error text={vm.error} />
        <Heading>{t('Sprache')}</Heading>
        <Card>
          <Body muted>
            {t('Zahlen und Datumsangaben folgen der Region deines Geräts.')}
          </Body>
          {[null, ...languages].map((language) => (
            <Button
              key={language ?? 'system'}
              secondary={locale.preference !== language}
              title={language ? languageNames[language] : t('Systemsprache')}
              disabled={vm.busy}
              onPress={() =>
                void vm.run(async () =>
                  setLocalization(await seriesNative.setLanguage(language)),
                )
              }
            />
          ))}
        </Card>
        <Heading>{t('Datensicherung')}</Heading>
        <Card style={{ padding: 0, gap: 0 }}>
          <Pressable
            accessibilityRole="button"
            disabled={vm.busy}
            onPress={() => void vm.create()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Icon name="lock_outline" />
            <View style={{ flex: 1, gap: 4 }}>
              <Body style={{ fontSize: 16 }}>
                {t('Verschlüsseltes Backup erstellen')}
              </Body>
              <Body muted>
                {t('Serien, Folgenstände, Fotos und Serienprotokolle')}
              </Body>
            </View>
            <Icon name="chevron_right" />
          </Pressable>
          <View style={{ height: 1, backgroundColor: c.border }} />
          <Pressable
            accessibilityRole="button"
            disabled={vm.busy}
            onPress={() => void vm.restore()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Icon name="settings_backup_restore_outlined" />
            <View style={{ flex: 1, gap: 4 }}>
              <Body style={{ fontSize: 16 }}>
                {t('Backup wiederherstellen')}
              </Body>
              <Body muted>
                {t('Vorhandene neuere Einträge bleiben erhalten')}
              </Body>
            </View>
            <Icon name="chevron_right" />
          </Pressable>
        </Card>
        <View style={{ marginTop: 6 }}>
          <Heading>{t('Datenschutz')}</Heading>
        </View>
        <Card style={{ padding: 18, gap: 0 }}>
          <Body>
            {t(
              'Fotos, Einträge und PDFs werden lokal auf deinem Gerät verarbeitet. Die App überträgt deine Seriendaten nicht an einen Server.',
            )}
          </Body>
          <Body style={{ marginTop: 10 }}>
            {t(
              'Deine Daten bleiben lokal auf deinem Gerät gespeichert, bis du sie in der App löschst oder die App-Daten entfernst.',
            )}
          </Body>
          <Body muted style={{ marginTop: 10 }}>
            {t('Entwickler und Datenschutzkontakt')}
            {'\n'}
            Wasiliy Strecker · AppFabrik AI
          </Body>
          <Body muted style={{ marginTop: 10 }}>
            {t(
              'Kamera und Galerie werden nur auf deinen Wunsch geöffnet. Fotos werden auf maximal 1920 Pixel verkleinert, ohne Standortmetadaten gespeichert und nicht automatisch hochgeladen. Benachrichtigungen erinnern lokal ans Weiterschauen. Es gibt keine Werbung und keine eigene Telemetrie.',
            )}
          </Body>
          <Body muted style={{ marginTop: 10 }}>
            {t(
              'Beim Exportieren oder Teilen entscheidest du über Ziel und Empfänger. Backups sind passwortgeschützt. Ohne Passwort können sie nicht wiederhergestellt werden.',
            )}
          </Body>
          <View style={{ marginTop: 14 }}>
            <Button
              secondary
              icon="open_in_new"
              title={t('Datenschutzerklärung öffnen')}
              disabled={vm.busy}
              onPress={() => void vm.openPrivacy()}
            />
          </View>
        </Card>
        <View style={{ marginTop: 6 }}>
          <Heading>{t('Über SerienLog')}</Heading>
        </View>
        <Card style={{ padding: 0, gap: 0 }}>
          <View style={{ padding: 18, gap: 12 }}>
            <Body strong>{t('SerienLog 1.0.0')}</Body>
            <Body muted>{t('Kostenlos. Ohne Konto. Ohne Werbung.')}</Body>
            <Body muted>
              {t(
                'Eigenständige lokale Android-App. Backups bis 128 MB. Formularentwürfe gehören nicht zum Backup.',
              )}
            </Body>
          </View>
        </Card>
      </Page>
      <BusyOverlay visible={!!vm.phase} label={vm.phase} />
      {prompt && (
        <PasswordDialog
          key={prompt.id}
          confirm={prompt.confirm}
          close={close}
        />
      )}
    </>
  );
}
