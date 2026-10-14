import * as migration_20260701_132238_initial from './20260701_132238_initial';
import * as migration_20260705_141452_siteconfig_holiday_tab from './20260705_141452_siteconfig_holiday_tab';
import * as migration_20261013_071552_product_available_days from './20261013_071552_product_available_days';
import * as migration_20261014_054621_one_off_availability_date from './20261014_054621_one_off_availability_date';

export const migrations = [
  {
    up: migration_20260701_132238_initial.up,
    down: migration_20260701_132238_initial.down,
    name: '20260701_132238_initial',
  },
  {
    up: migration_20260705_141452_siteconfig_holiday_tab.up,
    down: migration_20260705_141452_siteconfig_holiday_tab.down,
    name: '20260705_141452_siteconfig_holiday_tab',
  },
  {
    up: migration_20261013_071552_product_available_days.up,
    down: migration_20261013_071552_product_available_days.down,
    name: '20261013_071552_product_available_days',
  },
  {
    up: migration_20261014_054621_one_off_availability_date.up,
    down: migration_20261014_054621_one_off_availability_date.down,
    name: '20261014_054621_one_off_availability_date'
  },
];
