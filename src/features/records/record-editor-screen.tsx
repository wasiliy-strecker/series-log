import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  Body,
  Button,
  Busy,
  Card,
  Field,
  Notice,
  Page,
} from '../../core/ui/components';
import { SuggestionField } from '../../core/ui/suggestion-field';
import { useRecordEditor } from './use-record-editor';
import { ReminderEditor } from './reminder-editor';
export function RecordEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const vm = useRecordEditor(id);
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
      <Stack.Screen
        options={{ title: id ? 'Serie bearbeiten' : 'Serie anlegen' }}
      />
      <View style={{ gap: 16 }}>
        <Notice error text={vm.error} />
        <SuggestionField
          label="Genre *"
          placeholder="z. B. Drama oder Comedy"
          helper="Vorschlag auswählen oder eigenes Genre eingeben."
          value={r.category}
          suggestions={vm.categorySuggestions}
          disabled={vm.busy}
          showAllOnFocus
          onChange={(v) => vm.change('category', v)}
        />
        <Field
          label="Serientitel *"
          value={r.name}
          onChangeText={(v) => vm.change('name', v)}
          editable={!vm.busy}
        />
        <Card>
          <Body strong>Folgen & Staffeln</Body>
          <Body muted>
            Die Zahlen sind optional und können später ergänzt werden. Für
            Prozentfortschritt braucht SerienLog die Gesamtzahl und die Längen
            der vorherigen Staffeln.
          </Body>
          <Field
            label="Gesamtfolgenzahl (optional)"
            keyboardType="number-pad"
            value={vm.totalInput}
            onChangeText={vm.setTotalInput}
            editable={!vm.busy}
          />
          {vm.seasonInputs.map((value, index) => (
            <Field
              key={index}
              label={`Folgen in Staffel ${index + 1} (optional)`}
              keyboardType="number-pad"
              value={value}
              onChangeText={(v) => vm.changeSeason(index, v)}
              editable={!vm.busy}
            />
          ))}
          <Button
            secondary
            icon="add"
            title="Staffel ergänzen"
            disabled={vm.busy || vm.seasonInputs.length >= 200}
            onPress={vm.addSeason}
          />
          {!!vm.seasonInputs.length && (
            <Button
              secondary
              title="Letzte Staffel aus Angaben entfernen"
              disabled={vm.busy}
              onPress={vm.removeSeason}
            />
          )}
          <Body muted>
            Eine leere Folgenzahl bleibt unbekannt. Die Gesamtzahl umfasst die
            Folgen aller Staffeln, die du verfolgen möchtest.
          </Body>
        </Card>
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
        <Field
          label="Notiz (optional)"
          multiline
          value={r.note}
          onChangeText={(v) => vm.change('note', v)}
          editable={!vm.busy}
        />
      </View>
    </Page>
  );
}
