import 'dotenv/config';
import { migrations } from '../src/migrations';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import type { Payload } from 'payload';

export function getInitialMigrationName(): string {
  return migrations[0].name;
}

export async function markMigrationApplied(
  payload: Payload,
  migrationName: string,
): Promise<void> {
  await payload.create({
    collection: 'payload-migrations',
    data: {
      name: migrationName,
      batch: 1,
    },
  });
}

export async function verifyMigrationApplied(
  payload: Payload,
  migrationName: string,
): Promise<boolean> {
  const result = await payload.find({
    collection: 'payload-migrations',
    where: {
      and: [
        { name: { equals: migrationName } },
        { batch: { equals: 1 } },
      ],
    },
  });

  return result.docs.length > 0;
}

/**
 * Remove push-mode dev markers (batch === -1). Payload writes these when it
 * runs in push mode (dev), and their mere presence triggers an interactive
 * prompt in `payload migrate` that hangs non-interactive CI builds. Adoption
 * means leaving push mode, so these rows are obsolete. Legitimate migrations
 * use batch >= 1, so targeting batch === -1 is precise.
 */
export async function removePushModeMarkers(payload: Payload): Promise<number> {
  const result = await payload.delete({
    collection: 'payload-migrations',
    where: { batch: { equals: -1 } },
  });

  return result.docs.length;
}

async function main() {
  const migrationName = getInitialMigrationName();
  console.log(`Target database: ${process.env.DATABASE_URL ?? '(unset)'}`);
  console.log(`Adopting migration: ${migrationName}`);

  const payload = await getPayload({ config: await config });

  // 1. Clear push-mode markers so `payload migrate` won't prompt in CI.
  const removedCount = await removePushModeMarkers(payload);
  console.log(`✓ Removed ${removedCount} push-mode marker(s) (batch = -1)`);

  // 2. Mark the initial migration as already-applied WITHOUT running its
  //    CREATE TABLE statements (tables already exist from push mode). Skip
  //    the insert if already applied so re-runs don't create duplicate rows.
  const alreadyApplied = await verifyMigrationApplied(payload, migrationName);
  if (alreadyApplied) {
    console.log(`✓ Migration ${migrationName} already marked applied — skipping insert`);
  } else {
    await markMigrationApplied(payload, migrationName);
  }

  const verified = await verifyMigrationApplied(payload, migrationName);
  if (!verified) {
    console.error('Failed to verify migration was marked as applied');
    process.exit(1);
  }

  console.log('✓ Migration marked as applied and verified');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});