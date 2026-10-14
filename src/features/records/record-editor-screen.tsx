import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Body,
  Button,
  Busy,
  Field,
  Notice,
  Page,
} from '../../core/ui/components';
import { SuggestionField } from '../../core/ui/suggestion-field';
import { useRecordEditor } from './use-record-editor';
import { ReminderEditor } from './reminder-editor';
import { FormErrorScroll } from '../../core/ui/form-error-scroll';
export function RecordEditorScreen() {
  const { id, returnTo } = useLocalSearchParams<{
    id?: string;
    returnTo?: string;
  }>();
  const returnToEntry = returnTo === 'entry';
  const vm = useRecordEditor(id, returnToEntry);
  const anchors = useRef<Record<string, View | null>>({});
  const initialTarget = useMemo(
    () => (returnToEntry ? { field: 'totalEpisodes', attempt: 0 } : null),
    [returnToEntry],
  );
  const r = vm.record;
  if (!r)
    return (
      <Page ready={!!vm.error}>
        <Notice error text={vm.error} />
        {!vm.error && <Busy />}
      </Page>
    );
  const repair = vm.reminderNeedsRepair;
  return (
    <Page
      bottom={
        <>
          {!id && (
            <Body muted style={{ fontSize: 12 }}>
              Speichere zuerst die Serie. Anschließend kannst du deinen ersten
              Folgenstand mit einem optionalen Foto festhalten.
            </Body>
          )}
          {repair && (
            <Body>
              Die Erinnerung ist nicht bestätigt. Mit Speichern wird sie erneut
              eingerichtet.
            </Body>
          )}
          <Button
            icon={id && !vm.dirty ? 'check_circle_outline' : 'save_outlined'}
            title={
              vm.busy
                ? 'Wird gespeichert …'
                : repair && !vm.dirty
                  ? 'Erinnerung erneut speichern'
                  : id && !vm.dirty
                    ? 'Alles gespeichert'
                    : id
                      ? 'Änderungen speichern'
                      : 'Serie speichern'
            }
            disabled={vm.busy || (!vm.dirty && !repair)}
            onPress={() => void vm.save()}
          />
        </>
      }
    >
      <FormErrorScroll
        target={vm.errorTarget ?? initialTarget}
        anchors={anchors}
      />
      <Stack.Screen
        options={{ title: id ? 'Serie bearbeiten' : 'Serie anlegen' }}
      />
      <View style={{ gap: 16 }}>
        <Notice error text={vm.error} />
        <View
          ref={(view) => {
            anchors.current.category = view;
          }}
          collapsable={false}
        >
          <SuggestionField
            label="Genre *"
            error={vm.fieldErrors.category}
            placeholder="z. B. Drama oder Comedy"
            helper="Vorschlag auswählen oder eigenes Genre eingeben."
            value={r.category}
            suggestions={vm.categorySuggestions}
            disabled={vm.busy}
            showAllOnFocus
            onChange={(v) => vm.change('category', v)}
          />
        </View>
        <View
          ref={(view) => {
            anchors.current.name = view;
          }}
          collapsable={false}
        >
          <Field
            label="Serientitel *"
            error={vm.fieldErrors.name}
            value={r.name}
            onChangeText={(v) => vm.change('name', v)}
            editable={!vm.busy}
          />
        </View>
        <View
          ref={(view) => {
            anchors.current.totalEpisodes = view;
          }}
          collapsable={false}
          style={{ gap: 8 }}
        >
          <Field
            label="Gesamtfolgenzahl (optional)"
            error={vm.fieldErrors.totalEpisodes}
            keyboardType="number-pad"
            value={vm.totalInput}
            onChangeText={vm.setTotalInput}
            editable={!vm.busy}
          />
          <Body muted>
            Alle Folgen der Serie zusammen. Lass das Feld leer, wenn du die
            Gesamtzahl nicht kennst.
          </Body>
        </View>
        <ReminderEditor
          reminder={r.reminder}
          busy={vm.busy}
          onChange={(value) => vm.change('reminder', value)}
          recordId={id ? r.id : null}
          label={r.name}
          categoryLabel={r.category}
          status={vm.reminderStatus}
          refreshStatus={vm.refreshReminderStatus}
        />
        <View
          ref={(view) => {
            anchors.current.note = view;
          }}
          collapsable={false}
        >
          <Field
            label="Notiz (optional)"
            error={vm.fieldErrors.note}
            multiline
            value={r.note}
            onChangeText={(v) => vm.change('note', v)}
            editable={!vm.busy}
          />
        </View>
      </View>
    </Page>
  );
}
