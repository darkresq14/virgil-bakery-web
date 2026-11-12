import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_config\` ADD \`thank_you_title\` text;`)
  await db.run(sql`ALTER TABLE \`site_config\` ADD \`thank_you_message\` text;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` ADD \`version_thank_you_title\` text;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` ADD \`version_thank_you_message\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`thank_you_title\`;`)
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`thank_you_message\`;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_thank_you_title\`;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_thank_you_message\`;`)
}
