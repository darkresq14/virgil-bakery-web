import { execaCommand } from 'execa';

export function shouldRunMigrate(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
}

export async function runMigrateGuard(): Promise<void> {
  const shouldRun = shouldRunMigrate();
  const dryRun = process.env.DRY_RUN === '1';

  if (shouldRun) {
    if (dryRun) {
      console.log('[DRY RUN] Would run: pnpm payload migrate');
    } else {
      await execaCommand('pnpm payload migrate', { stdio: 'inherit' });
    }
  } else {
    if (dryRun) {
      console.log('[DRY RUN] Skipping migrate (non-production environment)');
    }
  }
}

await runMigrateGuard();
