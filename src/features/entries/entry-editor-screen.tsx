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

export function EntryEditorScreen() {
  const { recordId, entryId } = useLocalSearchParams<{
    recordId: string;
    entryId?: string;
  }>();
  const vm = useEntryEditor(recordId, entryId);
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
      <Stack.Screen
        options={{
          title: entryId ? 'Folgenstand bearbeiten' : 'Folgenstand erfassen',
        }}
      />
      <Notice error text={vm.error} />
      <Notice text={vm.notice} />
      <Body strong>{vm.record?.name}</Body>
      {vm.phase === 'choose' ? (
        <>
          <Card>
            <Body strong style={{ fontSize: 22 }}>
              Wo bist du stehen geblieben?
            </Body>
            <Body>
              Speichere deine Staffel und die zuletzt vollständig gesehene
              Folge. Ein Bild und eine Notiz sind optional.
            </Body>
            {vm.latest && <Body muted>Zuletzt: {entrySummary(vm.latest)}</Body>}
          </Card>
          <Button
            icon="edit_note_outlined"
            title="Ohne Foto erfassen"
            disabled={vm.busy}
            onPress={() => void vm.chooseManual()}
          />
          <Button
            secondary
            icon="photo_camera_outlined"
            title="Foto aufnehmen"
            disabled={vm.busy}
            onPress={() => void vm.pick('camera')}
          />
          <Button
            secondary
            icon="photo_library_outlined"
            title="Bild aus Galerie"
            disabled={vm.busy}
            onPress={() => void vm.pick('gallery')}
          />
        </>
      ) : (
        <View style={{ gap: 16 }}>
          <Card>
            {vm.latest && !entryId && (
              <Body muted>Zuletzt: {entrySummary(vm.latest)}</Body>
            )}
            <Field
              label="Staffel *"
              keyboardType="number-pad"
              value={form.season}
              onChangeText={(v) => vm.change('season', v)}
              editable={!vm.busy}
            />
            <Field
              label="Zuletzt gesehene Folge *"
              keyboardType="number-pad"
              value={form.episode}
              onChangeText={(v) => vm.change('episode', v)}
              editable={!vm.busy}
            />
            <Body muted>
              Folge 0 bedeutet, dass du diese Staffel noch nicht begonnen hast.
              Die Eingabe zählt vollständig gesehene Folgen ab Staffelbeginn.
            </Body>
            {!draft.completedSeason && (
              <Button
                secondary
                title="Nächste Staffel"
                icon="chevron_right"
                disabled={vm.busy}
                onPress={() => void vm.nextSeason()}
              />
            )}
            {draft.completedSeason && (
              <Body strong>
                Staffel {draft.completedSeason.season} wird mit{' '}
                {draft.completedSeason.episodes} Folgen abgeschlossen.
              </Body>
            )}
          </Card>
          <PhotoEditor photos={form.attachments} actions={actions} />
          <Card>
            <Body strong>Datum und Uhrzeit</Body>
            <DateField
              label="Gesehen am"
              time
              value={form.occurredAt}
              onChange={(v) => vm.change('occurredAt', v)}
              disabled={vm.busy}
            />
          </Card>
          <Field
            label="Notiz (optional)"
            multiline
            value={form.note}
            onChangeText={(v) => vm.change('note', v)}
            editable={!vm.busy}
          />
          <Body muted>
            Prüfe Staffel, Folge und Zeitpunkt vor dem Speichern.
          </Body>
          <Button
            icon="verified_outlined"
            title={
              vm.busy
                ? 'Wird gespeichert …'
                : entryId
                  ? 'Änderungen speichern'
                  : 'Bestätigen & speichern'
            }
            disabled={vm.busy}
            onPress={() => void vm.save()}
          />
        </View>
      )}
      {vm.busy && <Busy label="Folgenstand wird verarbeitet …" />}
    </Page>
  );
}
