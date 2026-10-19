import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'SerienLog Dev',
  slug: 'serienlog',
  version: '1.0.0',
  scheme: 'serienlog',
  orientation: 'default',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0C0C0F',
  platforms: ['android'],
  icon: './assets/icon.png',
  android: {
    package: 'com.appfactory.series_log',
    versionCode: 1,
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
    'expo-dev-client',
    // Android mods unwind in reverse order. Our final theme overrides must
    // run after expo-splash-screen has generated Theme.App.SplashScreen.
    './plugins/with-series-android',
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
    ['expo-image-picker', { microphonePermission: false }],
  ],
};
export default config;
