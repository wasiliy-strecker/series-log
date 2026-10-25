import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['scripts/store_assets/fixture.test.ts'],
    testTimeout: 120000,
  },
});
