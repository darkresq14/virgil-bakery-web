import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

// Weight becomes required integer grams (#60). Parseable free-text values
// ("800g", "1000", "1.5g", "1,5g") convert via the SQL expression inside the
// INSERTs below (comma decimals are normalized to dots before the CAST, so
// "1,5g" rounds to 2 like "1.5g"); everything else ("-", "Pachet", "Set 5
// buc", empty) becomes NULL for
// the baker to fill manually — those products stay unavailable until then.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`short_description\` text,
  	\`intro_product\` text,
  	\`description\` text,
  	\`product_type\` text DEFAULT 'paine',
  	\`sort_order\` numeric DEFAULT 0,
  	\`available\` integer DEFAULT true,
  	\`available_days\` text DEFAULT 'both',
  	\`available_on_date\` text,
  	\`featured\` integer DEFAULT false,
  	\`ingredients\` text,
  	\`allergens\` text,
  	\`nutritional_values\` text,
  	\`featured_image_id\` integer,
  	\`weight\` numeric,
  	\`price\` numeric,
  	\`ordering_info\` text,
  	\`meta_title\` text,
  	\`meta_image_id\` integer,
  	\`meta_description\` text,
  	\`published_at\` text,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products\`("id", "name", "short_description", "intro_product", "description", "product_type", "sort_order", "available", "available_days", "available_on_date", "featured", "ingredients", "allergens", "nutritional_values", "featured_image_id", "weight", "price", "ordering_info", "meta_title", "meta_image_id", "meta_description", "published_at", "generate_slug", "slug", "updated_at", "created_at", "_status") SELECT "id", "name", "short_description", "intro_product", "description", "product_type", "sort_order", "available", "available_days", "available_on_date", "featured", "ingredients", "allergens", "nutritional_values", "featured_image_id", CASE WHEN length(replace(replace(rtrim(rtrim(trim("weight"), 'gG')), ',', ''), '.', '')) > 0 AND replace(replace(rtrim(rtrim(trim("weight"), 'gG')), ',', ''), '.', '') NOT GLOB '*[^0-9]*' THEN CAST(round(CAST(replace(rtrim(rtrim(trim("weight"), 'gG')), ',', '.') AS REAL)) AS INTEGER) ELSE NULL END, "price", "ordering_info", "meta_title", "meta_image_id", "meta_description", "published_at", "generate_slug", "slug", "updated_at", "created_at", "_status" FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`products_featured_image_idx\` ON \`products\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_meta_meta_image_idx\` ON \`products\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`products__status_idx\` ON \`products\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__products_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_name\` text,
  	\`version_short_description\` text,
  	\`version_intro_product\` text,
  	\`version_description\` text,
  	\`version_product_type\` text DEFAULT 'paine',
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_available\` integer DEFAULT true,
  	\`version_available_days\` text DEFAULT 'both',
  	\`version_available_on_date\` text,
  	\`version_featured\` integer DEFAULT false,
  	\`version_ingredients\` text,
  	\`version_allergens\` text,
  	\`version_nutritional_values\` text,
  	\`version_featured_image_id\` integer,
  	\`version_weight\` numeric,
  	\`version_price\` numeric,
  	\`version_ordering_info\` text,
  	\`version_meta_title\` text,
  	\`version_meta_image_id\` integer,
  	\`version_meta_description\` text,
  	\`version_published_at\` text,
  	\`version_generate_slug\` integer DEFAULT true,
  	\`version_slug\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new__products_v\`("id", "parent_id", "version_name", "version_short_description", "version_intro_product", "version_description", "version_product_type", "version_sort_order", "version_available", "version_available_days", "version_available_on_date", "version_featured", "version_ingredients", "version_allergens", "version_nutritional_values", "version_featured_image_id", "version_weight", "version_price", "version_ordering_info", "version_meta_title", "version_meta_image_id", "version_meta_description", "version_published_at", "version_generate_slug", "version_slug", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_name", "version_short_description", "version_intro_product", "version_description", "version_product_type", "version_sort_order", "version_available", "version_available_days", "version_available_on_date", "version_featured", "version_ingredients", "version_allergens", "version_nutritional_values", "version_featured_image_id", CASE WHEN length(replace(replace(rtrim(rtrim(trim("version_weight"), 'gG')), ',', ''), '.', '')) > 0 AND replace(replace(rtrim(rtrim(trim("version_weight"), 'gG')), ',', ''), '.', '') NOT GLOB '*[^0-9]*' THEN CAST(round(CAST(replace(rtrim(rtrim(trim("version_weight"), 'gG')), ',', '.') AS REAL)) AS INTEGER) ELSE NULL END, "version_price", "version_ordering_info", "version_meta_title", "version_meta_image_id", "version_meta_description", "version_published_at", "version_generate_slug", "version_slug", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_products_v\`;`)
  await db.run(sql`DROP TABLE \`_products_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__products_v\` RENAME TO \`_products_v\`;`)
  await db.run(sql`CREATE INDEX \`_products_v_parent_idx\` ON \`_products_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_featured_image_idx\` ON \`_products_v\` (\`version_featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_meta_version_meta_image_idx\` ON \`_products_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_updated_at_idx\` ON \`_products_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_created_at_idx\` ON \`_products_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version__status_idx\` ON \`_products_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_created_at_idx\` ON \`_products_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_updated_at_idx\` ON \`_products_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_latest_idx\` ON \`_products_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_autosave_idx\` ON \`_products_v\` (\`autosave\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`short_description\` text,
  	\`intro_product\` text,
  	\`description\` text,
  	\`product_type\` text DEFAULT 'paine',
  	\`sort_order\` numeric DEFAULT 0,
  	\`available\` integer DEFAULT true,
  	\`available_days\` text DEFAULT 'both',
  	\`available_on_date\` text,
  	\`featured\` integer DEFAULT false,
  	\`ingredients\` text,
  	\`allergens\` text,
  	\`nutritional_values\` text,
  	\`featured_image_id\` integer,
  	\`weight\` text,
  	\`price\` numeric,
  	\`ordering_info\` text,
  	\`meta_title\` text,
  	\`meta_image_id\` integer,
  	\`meta_description\` text,
  	\`published_at\` text,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products\`("id", "name", "short_description", "intro_product", "description", "product_type", "sort_order", "available", "available_days", "available_on_date", "featured", "ingredients", "allergens", "nutritional_values", "featured_image_id", "weight", "price", "ordering_info", "meta_title", "meta_image_id", "meta_description", "published_at", "generate_slug", "slug", "updated_at", "created_at", "_status") SELECT "id", "name", "short_description", "intro_product", "description", "product_type", "sort_order", "available", "available_days", "available_on_date", "featured", "ingredients", "allergens", "nutritional_values", "featured_image_id", CASE WHEN "weight" IS NULL THEN NULL ELSE ("weight" || 'g') END, "price", "ordering_info", "meta_title", "meta_image_id", "meta_description", "published_at", "generate_slug", "slug", "updated_at", "created_at", "_status" FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`products_featured_image_idx\` ON \`products\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_meta_meta_image_idx\` ON \`products\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`products__status_idx\` ON \`products\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__products_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_name\` text,
  	\`version_short_description\` text,
  	\`version_intro_product\` text,
  	\`version_description\` text,
  	\`version_product_type\` text DEFAULT 'paine',
  	\`version_sort_order\` numeric DEFAULT 0,
  	\`version_available\` integer DEFAULT true,
  	\`version_available_days\` text DEFAULT 'both',
  	\`version_available_on_date\` text,
  	\`version_featured\` integer DEFAULT false,
  	\`version_ingredients\` text,
  	\`version_allergens\` text,
  	\`version_nutritional_values\` text,
  	\`version_featured_image_id\` integer,
  	\`version_weight\` text,
  	\`version_price\` numeric,
  	\`version_ordering_info\` text,
  	\`version_meta_title\` text,
  	\`version_meta_image_id\` integer,
  	\`version_meta_description\` text,
  	\`version_published_at\` text,
  	\`version_generate_slug\` integer DEFAULT true,
  	\`version_slug\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new__products_v\`("id", "parent_id", "version_name", "version_short_description", "version_intro_product", "version_description", "version_product_type", "version_sort_order", "version_available", "version_available_days", "version_available_on_date", "version_featured", "version_ingredients", "version_allergens", "version_nutritional_values", "version_featured_image_id", "version_weight", "version_price", "version_ordering_info", "version_meta_title", "version_meta_image_id", "version_meta_description", "version_published_at", "version_generate_slug", "version_slug", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_name", "version_short_description", "version_intro_product", "version_description", "version_product_type", "version_sort_order", "version_available", "version_available_days", "version_available_on_date", "version_featured", "version_ingredients", "version_allergens", "version_nutritional_values", "version_featured_image_id", CASE WHEN "version_weight" IS NULL THEN NULL ELSE ("version_weight" || 'g') END, "version_price", "version_ordering_info", "version_meta_title", "version_meta_image_id", "version_meta_description", "version_published_at", "version_generate_slug", "version_slug", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_products_v\`;`)
  await db.run(sql`DROP TABLE \`_products_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__products_v\` RENAME TO \`_products_v\`;`)
  await db.run(sql`CREATE INDEX \`_products_v_parent_idx\` ON \`_products_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_featured_image_idx\` ON \`_products_v\` (\`version_featured_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_meta_version_meta_image_idx\` ON \`_products_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_updated_at_idx\` ON \`_products_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_created_at_idx\` ON \`_products_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version__status_idx\` ON \`_products_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_created_at_idx\` ON \`_products_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_updated_at_idx\` ON \`_products_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_latest_idx\` ON \`_products_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_autosave_idx\` ON \`_products_v\` (\`autosave\`);`)
}
