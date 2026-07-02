import { describe, it, expect, vi } from 'vitest';
import type { Payload } from 'payload';

describe('db-baseline', () => {
  it('reads initial migration name from migrations index', async () => {
    const { getInitialMigrationName } = await import('../../scripts/db-baseline');

    const name = getInitialMigrationName();

    expect(name).toBe('20260701_132238_initial');
  });

  it('marks migration applied via Payload local API', async () => {
    const mockPayload: Partial<Payload> = {
      create: vi.fn().mockResolvedValue({}),
    };

    const { markMigrationApplied } = await import('../../scripts/db-baseline');
    await markMigrationApplied(mockPayload as Payload, '20260701_132238_initial');

    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'payload-migrations',
      data: {
        name: '20260701_132238_initial',
        batch: 1,
      },
    });
  });

  it('verifies row landed with correct name and batch', async () => {
    const mockPayload: Partial<Payload> = {
      find: vi.fn().mockResolvedValue({
        docs: [{ name: '20260701_132238_initial', batch: 1 }],
      }),
    };

    const { verifyMigrationApplied } = await import('../../scripts/db-baseline');
    const verified = await verifyMigrationApplied(
      mockPayload as Payload,
      '20260701_132238_initial',
    );

    expect(verified).toBe(true);
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'payload-migrations',
      where: {
        and: [
          { name: { equals: '20260701_132238_initial' } },
          { batch: { equals: 1 } },
        ],
      },
    });
  });
});