import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Int tests each boot the real Payload harness (getPayload) against the same
// local SQLite file; sqlite locks under parallel boot, so int files run
// sequentially in their own project. Unit files stay parallel. Projects do
// not inherit root plugins/setup, so each repeats the shared config.
const shared = {
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
} as const;

export default defineConfig({
  ...shared,
  test: {
    ...shared.test,
    projects: [
      {
        ...shared,
        test: {
          ...shared.test,
          name: 'unit',
          include: ['tests/unit/**/*.unit.spec.{ts,tsx}'],
        },
      },
      {
        ...shared,
        test: {
          ...shared.test,
          name: 'int',
          include: ['tests/int/**/*.int.spec.{ts,tsx}'],
          fileParallelism: false,
        },
      },
    ],
  },
});
