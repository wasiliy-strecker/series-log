import { createContext, useContext, useState, type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import { StartupError, StartupPending } from '../startup/startup';
export const dark = {
  background: '#0C0C0F',
  card: '#18181D',
  input: '#121216',
  ink: '#FAFAFA',
  muted: '#B7B7C2',
  primary: '#E50914',
  onPrimary: '#FFFFFF',
  soft: '#38151B',
  onSoft: '#FFCFD1',
  secondaryContainer: '#29292F',
  onSecondaryContainer: '#EEEEF2',
  errorContainer: '#4C171D',
  onErrorContainer: '#FFD9DC',
  border: '#35353D',
  overlayBorder: '#63343A',
  outline: '#9898A5',
  danger: '#FF858C',
  onDanger: '#370007',
  elevated: '#232329',
  disabled: '#303037',
  dark: true,
};
export const light = dark;
const ThemeContext = createContext(light);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <FontThemeProvider key={attempt} retry={() => setAttempt((n) => n + 1)}>
      {children}
    </FontThemeProvider>
  );
}
function FontThemeProvider({
  children,
  retry,
}: {
  children: ReactNode;
  retry(): void;
}) {
  const [loaded, error] = useFonts({
    Roboto: require('../../../assets/ui/Roboto-Regular.ttf'),
    RobotoMedium: require('../../../assets/ui/Roboto-Medium.ttf'),
    RobotoBold: require('../../../assets/ui/Roboto-Bold.ttf'),
    RobotoBlack: require('../../../assets/ui/Roboto-Black.ttf'),
    MaterialIcons: require('../../../assets/ui/MaterialIcons-Regular.otf'),
  });
  if (error)
    return (
      <StartupError
        message="Die Schriftarten konnten nicht geladen werden."
        retry={retry}
      />
    );
  if (!loaded) return <StartupPending />;
  return <ThemeContext.Provider value={dark}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
