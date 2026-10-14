import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`available_on_date\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_available_on_date\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`available_on_date\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_available_on_date\`;`)
}
