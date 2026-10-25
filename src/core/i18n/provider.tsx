import { useEffect, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { seriesNative } from '../native/series-native';
import { setLocalization } from './runtime';

// Native preferences are synchronous and available before the first React render.
setLocalization(seriesNative.getLocalization());

export function LocalizationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const refresh = () => setLocalization(seriesNative.getLocalization());
    refresh();
    const native = seriesNative.addListener('localizationChanged', refresh);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      native.remove();
      foreground.remove();
    };
  }, []);
  return children;
}
