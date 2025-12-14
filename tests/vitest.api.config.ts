import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/api/**/*.{test,spec}.{js,ts}'],
    environment: 'node',
    globals: true,
    testTimeout: 30000, // API tests might take longer
    hookTimeout: 10000,
    teardownTimeout: 10000,
    reporters: ['verbose'],
  }
});
