import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Adds the "Concediu" (Holiday Mode) tab to the SiteConfig global.
 *
 * The date fields are nullable: a missing pair means "no holiday", which keeps
 * the notice inactive. SQLite cannot ADD a NOT NULL column without a default,
 * and the holiday fields have no sensible default, so they are optional at the
 * DB level (Payload marks them optional in config too).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_config\` ADD \`holiday_start_date\` text;`)
  await db.run(sql`ALTER TABLE \`site_config\` ADD \`holiday_end_date\` text;`)
  await db.run(sql`ALTER TABLE \`site_config\` ADD \`holiday_modal_title\` text;`)
  await db.run(
    sql`ALTER TABLE \`site_config\` ADD \`holiday_modal_image_id\` integer REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null;`,
  )
  await db.run(sql`ALTER TABLE \`site_config\` ADD \`holiday_modal_message\` text;`)
  await db.run(
    sql`CREATE INDEX \`site_config_holiday_modal_image_idx\` ON \`site_config\` (\`holiday_modal_image_id\`);`,
  )

  await db.run(sql`ALTER TABLE \`_site_config_v\` ADD \`version_holiday_start_date\` text;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` ADD \`version_holiday_end_date\` text;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` ADD \`version_holiday_modal_title\` text;`)
  await db.run(
    sql`ALTER TABLE \`_site_config_v\` ADD \`version_holiday_modal_image_id\` integer REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null;`,
  )
  await db.run(sql`ALTER TABLE \`_site_config_v\` ADD \`version_holiday_modal_message\` text;`)
  await db.run(
    sql`CREATE INDEX \`_site_config_v_version_version_holiday_modal_image_idx\` ON \`_site_config_v\` (\`version_holiday_modal_image_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`site_config_holiday_modal_image_idx\`;`)
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`holiday_modal_message\`;`)
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`holiday_modal_image_id\`;`)
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`holiday_modal_title\`;`)
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`holiday_end_date\`;`)
  await db.run(sql`ALTER TABLE \`site_config\` DROP COLUMN \`holiday_start_date\`;`)

  await db.run(
    sql`DROP INDEX IF EXISTS \`_site_config_v_version_version_holiday_modal_image_idx\`;`,
  )
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_holiday_modal_message\`;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_holiday_modal_image_id\`;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_holiday_modal_title\`;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_holiday_end_date\`;`)
  await db.run(sql`ALTER TABLE \`_site_config_v\` DROP COLUMN \`version_holiday_start_date\`;`)
}
