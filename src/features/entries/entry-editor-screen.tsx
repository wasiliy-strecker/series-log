import { t } from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { useRef } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Body,
  Button,
  Busy,
  Card,
  DateField,
  Field,
  Notice,
  Page,
} from '../../core/ui/components';
import { PhotoEditor, type AttachmentActions } from '../media/attachments';
import { useEntryEditor } from './use-entry-editor';
import { entrySummary } from '../records/presentation-model';
import { FormErrorScroll } from '../../core/ui/form-error-scroll';
import { CaptureGuidance } from './capture-guidance';
import { PhotoExamplesButton } from './photo-examples-button';
export function EntryEditorScreen() {
  useLocalization();
  const { recordId, entryId } = useLocalSearchParams<{
    recordId: string;
    entryId?: string;
  }>();
  const vm = useEntryEditor(recordId, entryId);
  const anchors = useRef<Record<string, View | null>>({});
  const draft = vm.draft;
  if (!draft)
    return (
      <Page ready={!!vm.error}>
        <Notice error text={vm.error} />
        {!vm.error && <Busy />}
      </Page>
    );
  const form = draft.form;
  const actions: AttachmentActions = {
    busy: vm.busy,
    pick: (source, id) => {
      if (source === 'camera' || source === 'gallery')
        return vm.pick(source, id);
      return Promise.resolve();
    },
    remove: vm.remove,
    move: vm.move,
    reorder: vm.reorderKind,
  };
  return (
    <Page>
      <FormErrorScroll target={vm.errorTarget} anchors={anchors} />
      <Stack.Screen
        options={{
          title: entryId
            ? t('Folgenstand bearbeiten')
            : t('Folgenstand erfassen'),
        }}
      />
      <Notice error text={vm.error} />
      <Notice text={vm.notice} />
      <Body strong>{vm.record?.name}</Body>
      {vm.phase === 'choose' ? (
        <>
          <CaptureGuidance
            latest={vm.latest ? entrySummary(vm.latest) : undefined}
          />
          <PhotoExamplesButton disabled={vm.busy} />
          <Button
            icon="edit_note_outlined"
            title={t('Ohne Foto erfassen')}
            disabled={vm.busy}
            onPress={() => void vm.chooseManual()}
          />
          <Button
            secondary
            icon="photo_camera_outlined"
            title={t('Foto aufnehmen')}
            disabled={vm.busy}
            onPress={() => void vm.pick('camera')}
          />
          <Button
            secondary
            icon="photo_library_outlined"
            title={t('Bild aus Galerie')}
            disabled={vm.busy}
            onPress={() => void vm.pick('gallery')}
          />
        </>
      ) : (
        <View style={{ gap: 16 }}>
          <Card>
            {vm.latest && !entryId && (
              <Body muted>
                {t('Zuletzt:')} {entrySummary(vm.latest)}
              </Body>
            )}
            <View
              ref={(view) => {
                anchors.current.season = view;
              }}
              collapsable={false}
            >
              <Field
                label={t('Staffel *')}
                error={vm.fieldErrors.season}
                keyboardType="number-pad"
                value={form.season}
                onChangeText={(v) => vm.change('season', v)}
                editable={!vm.busy}
              />
            </View>
            <View
              ref={(view) => {
                anchors.current.episode = view;
              }}
              collapsable={false}
            >
              <Field
                label={t('Zuletzt gesehene Folge *')}
                error={vm.fieldErrors.episode}
                keyboardType="number-pad"
                value={form.episode}
                onChangeText={(v) => vm.change('episode', v)}
                editable={!vm.busy}
              />
            </View>
          </Card>
          <PhotoEditor photos={form.attachments} actions={actions} />
          <Card>
            <Body strong>{t('Datum und Uhrzeit')}</Body>
            <View
              ref={(view) => {
                anchors.current.occurredAt = view;
              }}
              collapsable={false}
            >
              <DateField
                label={t('Gesehen am')}
                error={vm.fieldErrors.occurredAt}
                time
                value={form.occurredAt}
                onChange={(v) => vm.change('occurredAt', v)}
                disabled={vm.busy}
              />
            </View>
          </Card>
          <View
            ref={(view) => {
              anchors.current.note = view;
            }}
            collapsable={false}
          >
            <Field
              label={t('Notiz (optional)')}
              error={vm.fieldErrors.note}
              multiline
              value={form.note}
              onChangeText={(v) => vm.change('note', v)}
              editable={!vm.busy}
            />
          </View>
          <Body muted>
            {t('Prüfe Staffel, Folge und Zeitpunkt vor dem Speichern.')}
          </Body>
          <Button
            icon="verified_outlined"
            title={
              vm.busy
                ? t('Wird gespeichert …')
                : entryId
                  ? t('Änderungen speichern')
                  : t('Folgenstand speichern')
            }
            disabled={vm.busy}
            onPress={() => void vm.save()}
          />
        </View>
      )}
      {vm.busy && <Busy label={t('Folgenstand wird verarbeitet …')} />}
    </Page>
  );
}
