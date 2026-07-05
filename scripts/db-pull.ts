import { execaCommand } from 'execa';
import { rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export interface DbPullOptions {
  dbName: string | undefined;
  devDbPath?: string;
  fs?: {
    existsSync: typeof existsSync;
    rm: typeof rm;
    copyFile: (source: string, destination: string) => Promise<void>;
  };
}

export async function main(options?: DbPullOptions): Promise<void> {
  const {
    dbName: optionsDbName,
    devDbPath = 'dev.db',
    fs: fsOps = { existsSync, rm, copyFile },
  } = options || {};

  const dbName = optionsDbName ?? process.env.PROD_TURSO_DATABASE_NAME;

  if (!dbName) {
    throw new Error('PROD_TURSO_DATABASE_NAME environment variable is required');
  }

  console.log(`Exporting Turso database: ${dbName}`);

  // Export to temp file (need to run from correct directory)
  const tempPath = `${devDbPath}.export`;
  await execaCommand(
    `wsl bash -c 'cd /mnt/g/Code/virgil-bakery-web && ~/.turso/turso db export --output-file ${tempPath} --overwrite ${dbName}'`,
    { stdio: 'inherit' },
  );

  console.log(`Replacing ${devDbPath} with exported database`);

  // Remove old files using wsl to avoid Windows lock issues
  try {
    await execaCommand(`wsl rm -f /mnt/g/Code/virgil-bakery-web/${devDbPath} /mnt/g/Code/virgil-bakery-web/${devDbPath}-wal /mnt/g/Code/virgil-bakery-web/${devDbPath}-shm`);
  } catch {
    // Files might be locked, continue
    console.log(`  Note: Could not remove old ${devDbPath} files`);
  }

  // Copy using Node.js fs to avoid Windows command issues
  await fsOps.copyFile(tempPath, devDbPath);
  try {
    await fsOps.copyFile(`${tempPath}-wal`, `${devDbPath}-wal`);
  } catch {
    // WAL file might not exist, ignore
  }
  try {
    await fsOps.copyFile(`${tempPath}-shm`, `${devDbPath}-shm`);
  } catch {
    // SHM file might not exist, ignore
  }
  await fsOps.rm(tempPath);
  try {
    await fsOps.rm(`${tempPath}-wal`);
  } catch {
    // Ignore
  }
  try {
    await fsOps.rm(`${tempPath}-shm`);
  } catch {
    // Ignore
  }

  console.log('✓ Database pull complete');
}