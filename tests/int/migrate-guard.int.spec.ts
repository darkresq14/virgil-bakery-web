import { execaCommand } from 'execa';
import { afterEach, describe, expect, it, vi } from 'vitest';

const execaCommandMock = vi.mocked(execaCommand);

vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}));

describe('migrate-guard', () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.VERCEL_ENV;
    delete process.env.DRY_RUN;
  });

  it('runs payload migrate when VERCEL_ENV=production', async () => {
    process.env.VERCEL_ENV = 'production';

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).toHaveBeenCalledWith('pnpm payload migrate', {
      stdio: 'inherit',
    });
  });

  it('runs payload migrate when VERCEL_ENV=preview', async () => {
    process.env.VERCEL_ENV = 'preview';

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).toHaveBeenCalledWith('pnpm payload migrate', {
      stdio: 'inherit',
    });
  });

  it('skips migrate when VERCEL_ENV=development', async () => {
    process.env.VERCEL_ENV = 'development';

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).not.toHaveBeenCalled();
  });

  it('skips migrate when VERCEL_ENV is unset', async () => {
    delete process.env.VERCEL_ENV;

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).not.toHaveBeenCalled();
  });

  it('outputs dry-run message for production with DRY_RUN=1', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.DRY_RUN = '1';
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('[DRY RUN] Would run: pnpm payload migrate');
    consoleLogSpy.mockRestore();
  });

  it('outputs dry-run message for preview with DRY_RUN=1 without invoking migrate', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.DRY_RUN = '1';
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('[DRY RUN] Would run: pnpm payload migrate');
    consoleLogSpy.mockRestore();
  });

  it('outputs dry-run message for non-production with DRY_RUN=1', async () => {
    process.env.VERCEL_ENV = 'development';
    process.env.DRY_RUN = '1';
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { runMigrateGuard } = await import('../../scripts/migrate-guard');
    await runMigrateGuard();

    expect(execaCommandMock).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[DRY RUN] Skipping migrate (non-production environment)',
    );
    consoleLogSpy.mockRestore();
  });
});
