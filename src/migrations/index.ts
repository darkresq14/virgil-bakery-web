import * as migration_20260701_132238_initial from './20260701_132238_initial';
import * as migration_20260705_141452_siteconfig_holiday_tab from './20260705_141452_siteconfig_holiday_tab';

export const migrations = [
  {
    up: migration_20260701_132238_initial.up,
    down: migration_20260701_132238_initial.down,
    name: '20260701_132238_initial',
  },
  {
    up: migration_20260705_141452_siteconfig_holiday_tab.up,
    down: migration_20260705_141452_siteconfig_holiday_tab.down,
    name: '20260705_141452_siteconfig_holiday_tab'
  },
];
