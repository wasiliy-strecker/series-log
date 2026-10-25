import { t } from '../../core/i18n/runtime';
import { useLocalization } from '../../core/i18n/react';
import { View } from 'react-native';
import { Body, Card } from '../../core/ui/components';
export function CaptureGuidance({ latest }: { latest?: string }) {
  useLocalization();
  return (
    <Card style={{ padding: 18, gap: 14 }}>
      <Body strong style={{ fontSize: 18, lineHeight: 26 }}>
        {t('Für ein gut lesbares Foto')}
      </Body>
      <View>
        <Body>{t('• Staffel und Folge gerade und vollständig aufnehmen')}</Body>
        <Body>{t('• Spiegelungen, Schatten und Unschärfe vermeiden')}</Body>
        <Body>{t('• Die zuletzt vollständig gesehene Folge festhalten')}</Body>
      </View>
      <Body muted>
        {t(
          'Das Foto wird für die lokale Speicherung auf maximal 1920 Pixel an der längsten Kante verkleinert und als JPEG optimiert. Aufnahme- und Standortmetadaten werden nicht übernommen.',
        )}
      </Body>
      <Body>
        {t(
          'Staffel und Folge trägst du anschließend selbst ein. Beide Angaben sind Pflichtfelder. Ein Foto und eine Notiz sind optional.',
        )}
      </Body>
      {latest && (
        <Body muted>
          {t('Zuletzt:')} {latest}
        </Body>
      )}
    </Card>
  );
}
