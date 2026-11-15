import { vi } from 'vitest';

// Presentation tests run in Node. UI suites supply their own component mocks.
vi.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 35, isMacCatalyst: false },
}));
