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

async function main() {
  const migrationName = getInitialMigrationName();
  console.log(`Marking migration as applied: ${migrationName}`);

  const payload = await getPayload({ config: await config });

  await markMigrationApplied(payload, migrationName);
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