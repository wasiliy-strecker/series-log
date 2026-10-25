import { t } from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { View, type ViewProps } from 'react-native';
import { requireNativeView } from 'expo';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActionRow,
  Button,
  Busy,
  IconButton,
  Notice,
  Page,
  SelectField,
  useTheme,
} from '../../core/ui/components';
import { usePdfPreview } from './use-pdf-preview';
const DocumentView = requireNativeView<
  ViewProps & {
    session: string;
  }
>('SeriesNative');
export function PdfPreviewScreen() {
  useLocalization();
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const vm = usePdfPreview(id),
    c = useTheme();
  const pdf = vm.pdf;
  const partCount = pdf?.parts[0]?.partCount ?? 1;
  const multipart = partCount > 1;
  return (
    <Page
      ready={!vm.loading}
      scroll={false}
      bottom={
        pdf?.kind === 'report' ? (
          <>
            <ActionRow>
              {[
                <Button
                  key="print"
                  secondary
                  icon="print_outlined"
                  title={t('Drucken')}
                  disabled={vm.busy}
                  onPress={() => void vm.print()}
                />,
                <Button
                  key="share"
                  icon="ios_share_outlined"
                  title={multipart ? t('Diesen Teil teilen') : t('Teilen')}
                  disabled={vm.busy}
                  onPress={() => void vm.share()}
                />,
              ]}
            </ActionRow>
            {multipart && (
              <Button
                title={t('Alle teilen')}
                icon="share_outlined"
                disabled={vm.busy || pdf.parts.length !== partCount}
                onPress={() => void vm.shareAll()}
              />
            )}
          </>
        ) : undefined
      }
    >
      <Stack.Screen
        options={{
          title:
            pdf?.kind === 'attachment'
              ? pdf.name
              : multipart
                ? t('Serienprotokoll · {p0} Teile', { p0: partCount })
                : t('Serienprotokoll'),
          headerRight:
            pdf?.kind === 'attachment'
              ? () => (
                  <IconButton
                    icon="share_outlined"
                    label={t('Teilen')}
                    onPress={() => void vm.share()}
                  />
                )
              : undefined,
        }}
      />
      {multipart && pdf && (
        <View style={{ padding: 12, gap: 8 }}>
          <SelectField
            label={t('PDF-Teil auswählen')}
            value={pdf.id}
            disabled={vm.busy || vm.loading}
            options={pdf.parts.map((part) => ({
              value: part.id,
              label: t('Teil {p0} von {p1}', {
                p0: part.partIndex,
                p1: part.partCount,
              }),
            }))}
            onChange={vm.selectPart}
          />
          {pdf.parts.length !== partCount && (
            <Notice
              text={t(
                'Ein Teil dieses Protokolls wurde gelöscht. Die vorhandenen Teile kannst du einzeln öffnen und teilen.',
              )}
            />
          )}
        </View>
      )}
      {!!vm.error && (
        <View style={{ padding: 12, gap: 8 }}>
          <Notice error text={vm.error} />
          {!pdf && (
            <Button
              secondary
              title={t('Erneut versuchen')}
              onPress={vm.retry}
            />
          )}
        </View>
      )}
      {vm.loading ? (
        <Busy label={t('PDF wird geöffnet …')} />
      ) : (
        pdf && (
          <DocumentView
            session={pdf.preview.session}
            style={{ flex: 1, backgroundColor: c.background }}
          />
        )
      )}
    </Page>
  );
}
