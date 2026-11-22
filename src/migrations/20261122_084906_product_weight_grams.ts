import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

// Weight becomes required integer grams (#60). Parseable free-text values
// ("800g", "1000", "1.5g", "1,5g") convert via the SQL expression inside the
// UPDATEs below (comma decimals are normalized to dots before the CAST, so
// "1,5g" rounds to 2 like "1.5g"); everything else ("-", "Pachet", "Set 5
// buc", empty) becomes NULL for the baker to fill manually — those products
// stay unavailable until then.
//
// IMPORTANT: Uses ALTER TABLE ADD/UPDATE/DROP/RENAME COLUMN instead of
// Drizzle's default PRAGMA foreign_keys=OFF + DROP TABLE rebuild. In SQLite,
// PRAGMA foreign_keys=OFF is a silent no-op inside a transaction (and Payload
// runs every migration in a transaction), so DROP TABLE `products` / `_products_v`
// fires ON DELETE SET NULL on `_products_v.parent_id` and ON DELETE CASCADE on
// all child tables (`products_characteristics`, `products_gallery`, `products_tags`,
// and their `_products_v_version_*` counterparts).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD COLUMN \`__weight_tmp\` numeric;`);
  await db.run(
    sql`UPDATE \`products\` SET \`__weight_tmp\` = CASE WHEN length(replace(replace(rtrim(rtrim(trim("weight"), 'gG')), ',', ''), '.', '')) > 0 AND replace(replace(rtrim(rtrim(trim("weight"), 'gG')), ',', ''), '.', '') NOT GLOB '*[^0-9]*' THEN CAST(round(CAST(replace(rtrim(rtrim(trim("weight"), 'gG')), ',', '.') AS REAL)) AS INTEGER) ELSE NULL END;`,
  );
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`weight\`;`);
  await db.run(sql`ALTER TABLE \`products\` RENAME COLUMN \`__weight_tmp\` TO \`weight\`;`);

  await db.run(sql`ALTER TABLE \`_products_v\` ADD COLUMN \`__version_weight_tmp\` numeric;`);
  await db.run(
    sql`UPDATE \`_products_v\` SET \`__version_weight_tmp\` = CASE WHEN length(replace(replace(rtrim(rtrim(trim("version_weight"), 'gG')), ',', ''), '.', '')) > 0 AND replace(replace(rtrim(rtrim(trim("version_weight"), 'gG')), ',', ''), '.', '') NOT GLOB '*[^0-9]*' THEN CAST(round(CAST(replace(rtrim(rtrim(trim("version_weight"), 'gG')), ',', '.') AS REAL)) AS INTEGER) ELSE NULL END;`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_weight\`;`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` RENAME COLUMN \`__version_weight_tmp\` TO \`version_weight\`;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD COLUMN \`__weight_tmp\` text;`);
  await db.run(
    sql`UPDATE \`products\` SET \`__weight_tmp\` = CASE WHEN "weight" IS NULL THEN NULL ELSE ("weight" || 'g') END;`,
  );
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`weight\`;`);
  await db.run(sql`ALTER TABLE \`products\` RENAME COLUMN \`__weight_tmp\` TO \`weight\`;`);

  await db.run(sql`ALTER TABLE \`_products_v\` ADD COLUMN \`__version_weight_tmp\` text;`);
  await db.run(
    sql`UPDATE \`_products_v\` SET \`__version_weight_tmp\` = CASE WHEN "version_weight" IS NULL THEN NULL ELSE ("version_weight" || 'g') END;`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_weight\`;`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` RENAME COLUMN \`__version_weight_tmp\` TO \`version_weight\`;`,
  );
}
