import { useSyncExternalStore } from 'react';
import { localization, subscribeLocalization } from './runtime';

export function useLocalization() {
  return useSyncExternalStore(
    subscribeLocalization,
    localization,
    localization,
  );
}
