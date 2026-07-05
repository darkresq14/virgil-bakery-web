import * as migration_20260701_132238_initial from './20260701_132238_initial';

export const migrations = [
  {
    up: migration_20260701_132238_initial.up,
    down: migration_20260701_132238_initial.down,
    name: '20260701_132238_initial'
  },
];
