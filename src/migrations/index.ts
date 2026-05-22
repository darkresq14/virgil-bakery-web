import * as migration_20260522_140221_product_type_and_tags from './20260522_140221_product_type_and_tags';

export const migrations = [
  {
    up: migration_20260522_140221_product_type_and_tags.up,
    down: migration_20260522_140221_product_type_and_tags.down,
    name: '20260522_140221_product_type_and_tags'
  },
];
