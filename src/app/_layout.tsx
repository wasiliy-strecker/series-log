import { t } from '../core/i18n/runtime';
import { useLocalization } from '../core/i18n/react';
import { LocalizationProvider } from '../core/i18n/provider';
import { Stack, router } from 'expo-router';
import {
  ThemeProvider as NavigationThemeProvider,
  DefaultTheme,
  DarkTheme,
} from 'expo-router/react-navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { ServicesProvider } from '../core/composition';
import { ThemeProvider, useTheme } from '../core/ui/theme';
import { FeedbackProvider } from '../core/ui/feedback';
import { IconButton } from '../core/ui/components';
import { StartupProvider, useStartup } from '../core/startup/startup';
function Routes() {
  useLocalization();
  const { pending } = useStartup();
  const c = useTheme(),
    safe = useSafeAreaInsets();
  const theme = c.dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider
      value={{
        ...theme,
        colors: {
          ...theme.colors,
          background: c.background,
          card: c.background,
          text: c.ink,
          primary: c.primary,
          border: c.border,
        },
      }}
    >
      <StatusBar style={pending || c.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: c.background },
          // Android duration: 200 ms via resources in with-series-android.
          animation: 'slide_from_right',
          header: ({ options, back, route }) => (
            <View
              style={{ paddingTop: safe.top, backgroundColor: c.background }}
            >
              <View
                style={{
                  height: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingLeft: back ? 4 : 16,
                  paddingRight: 4,
                  gap: 4,
                }}
              >
                {!!back && (
                  <IconButton
                    icon="arrow_back"
                    label={t('Zurück')}
                    onPress={() => {
                      if (router.canGoBack()) router.back();
                      else router.replace('/');
                    }}
                  />
                )}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: back ? 'Roboto' : 'RobotoBlack',
                    fontSize: 22,
                    color: back ? c.ink : c.primary,
                    flex: 1,
                    marginLeft: back ? 16 : 0,
                  }}
                >
                  {options.title ?? t('SerienLog')}
                </Text>
                {options.headerRight?.({ tintColor: c.ink, canGoBack: !!back })}
                {route.name === 'index' && (
                  <IconButton
                    icon="settings_outlined"
                    label={t('Einstellungen')}
                    onPress={() => router.push('/settings')}
                  />
                )}
              </View>
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: t('SerienLog') }} />
        <Stack.Screen name="record/[id]" options={{ title: t('Serie') }} />
        <Stack.Screen
          name="record/edit"
          options={{ title: t('Serie anlegen') }}
        />
        <Stack.Screen
          name="record/history"
          options={{ title: t('Serienverlauf') }}
        />
        <Stack.Screen
          name="entry/edit"
          options={{ title: t('Folgenstand erfassen') }}
        />
        <Stack.Screen name="entry/[id]" options={{ title: t('Folgenstand') }} />
        <Stack.Screen
          name="pdf/[id]"
          options={{ title: t('Serienprotokoll') }}
        />
        <Stack.Screen name="settings" options={{ title: t('Einstellungen') }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
export default function Layout() {
  useLocalization();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocalizationProvider>
          <StartupProvider>
            <ThemeProvider>
              <FeedbackProvider>
                <ServicesProvider>
                  <Routes />
                </ServicesProvider>
              </FeedbackProvider>
            </ThemeProvider>
          </StartupProvider>
        </LocalizationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
