import { t } from '../core/i18n/runtime';
import { useLocalization } from '../core/i18n/react';
import { router } from 'expo-router';
import { Body, Button, Page } from '../core/ui/components';
export default function NotFoundScreen() {
  useLocalization();
  return (
    <Page>
      <Body>{t('Diese Seite wurde nicht gefunden.')}</Body>
      <Button
        title={t('Zur Serienübersicht')}
        onPress={() => router.replace('/')}
      />
    </Page>
  );
}
