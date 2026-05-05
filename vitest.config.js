import { defineConfig } from "vitest/config";
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/js/**/*.test.{js,jsx}'],
    exclude: ['tests/js/navigation.test.js'],
    coverage: {
      provider: 'istanbul',
      include: ['assets/js/**/*.{js,jsx}'],
      exclude: ['assets/js/constants.js'],
      reporter: ['text', 'lcov'],
      // Coverage thresholds — automatically enforced
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60
      }
    },
    setupFiles: ['tests/js/setup.js'],
  },
  resolve: {
    alias: {
      '../consts': path.resolve(__dirname, './assets/consts.js'),
    },
  },
});
