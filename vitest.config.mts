import { tmpdir } from 'node:os';
import { join } from 'node:path';

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Node ≥22 ships an experimental `localStorage` global; without
// --localstorage-file it is a lazy getter that resolves to undefined and
// SHADOWS the jsdom-provided storage on globalThis (verified on Node 26:
// `window.localStorage` → undefined + ExperimentalWarning). Give Node a real
// (SQLite-backed) storage file so the global resolves to a working Storage
// instance. vitest.setup.ts then aligns the `Storage` global with it so
// specs spying on Storage.prototype intercept as intended. Per-run file
// (main-process pid) so concurrent vitest runs don't share one SQLite file;
// within a run, specs that touch storage mock Storage.prototype, so no real
// cross-worker IO happens.
const localStorageFile = join(tmpdir(), `vitest-localstorage-${process.pid}.sqlite`);

// Int tests each boot the real Payload harness (getPayload) against the same
// local SQLite file; sqlite locks under parallel boot, so int files run
// sequentially in their own project. Unit files stay parallel. Projects do
// not inherit root plugins/setup, so each repeats the shared config.
const shared = {
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Vitest 4 flattened pool options — execArgv lives at the top level now.
    execArgv: [`--localstorage-file=${localStorageFile}`],
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
