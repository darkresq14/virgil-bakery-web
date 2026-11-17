import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` ADD \`gls_point_gold_id\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD \`gls_point_matchcode\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD \`gls_point_nume\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD \`gls_point_adresa\` text;`)
  await db.run(sql`ALTER TABLE \`orders\` ADD \`gls_point_tip\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`gls_point_gold_id\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`gls_point_matchcode\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`gls_point_nume\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`gls_point_adresa\`;`)
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`gls_point_tip\`;`)
}
