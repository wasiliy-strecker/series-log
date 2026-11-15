import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'SerienLog Dev',
  slug: 'serienlog',
  version: '1.0.0',
  scheme: 'serienlog',
  orientation: 'default',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0C0C0F',
  platforms: ['android', 'ios'],
  icon: './assets/icon.png',
  locales: Object.fromEntries(
    ['en', 'de', 'es', 'fr', 'it', 'pt-BR'].map((language) => [
      language,
      `./assets/apple-locales/${language}.json`,
    ]),
  ),
  ios: {
    bundleIdentifier: 'de.appfabrik.serieslog',
    buildNumber: '1',
    appleTeamId: 'XLR3785994',
    supportsTablet: true,
    infoPlist: {
      CFBundleDisplayName: 'Series Log',
      ITSAppUsesNonExemptEncryption: false,
      UIFileSharingEnabled: false,
      LSSupportsOpeningDocumentsInPlace: false,
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  android: {
    package: 'com.appfactory.series_log',
    versionCode: 2,
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/icon-foreground.png',
      backgroundColor: '#0C0C0F',
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.VIBRATE',
    ],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VIDEO',
    ],
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-build-properties',
      { ios: { enableSceneSupport: true, usePrecompiledModules: false } },
    ],
    'expo-dev-client',
    // Android mods unwind in reverse order. Our final theme overrides must
    // run after expo-splash-screen has generated Theme.App.SplashScreen.
    './plugins/with-series-android',
    './plugins/with-series-mac',
    [
      'expo-splash-screen',
      {
        image: './assets/icon-foreground.png',
        imageWidth: 256,
        resizeMode: 'contain',
        backgroundColor: '#0C0C0F',
        dark: { backgroundColor: '#0C0C0F' },
      },
    ],
    'expo-font',
    'expo-asset',
    'expo-sharing',
    [
      'expo-image-picker',
      {
        microphonePermission: false,
        cameraPermission:
          'Attach a photo to your viewing progress on this device.',
        photosPermission:
          'Select photos to attach to your viewing progress on this device.',
      },
    ],
  ],
};
export default config;
