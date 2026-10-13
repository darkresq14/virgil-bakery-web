import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`available_days\` text DEFAULT 'both';`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`availability_text\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_available_days\` text DEFAULT 'both';`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_availability_text\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`availability_text\` text;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`available_days\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_availability_text\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_available_days\`;`)
}
