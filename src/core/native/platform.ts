import { Platform } from 'react-native';

// React Native reports Catalyst as iOS. Distinguish it from iPhone/iPad and
// from an unmodified iPad app running on an Apple Silicon Mac.
export const isMac = () =>
  Platform.OS === 'ios' && Platform.isMacCatalyst === true;
