import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execaCommand } from 'execa';
import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

vi.mock('dotenv/config', () => ({}));

const execaCommandMock = vi.mocked(execaCommand);

vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}));

describe('db-pull', () => {
  const mockExistsSync = vi.fn();
  const mockRm = vi.fn().mockResolvedValue(undefined);
  const mockCopyFile = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PROD_TURSO_DATABASE_NAME', 'virgil-bakery-web-prod');
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exports Turso database and copies to dev.db', async () => {
    execaCommandMock
      .mockResolvedValueOnce({ stdout: 'Exported database to dev.db.export', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

    const { main } = await import('../../scripts/db-pull');

    await main({ fs: { existsSync: mockExistsSync, rm: mockRm, copyFile: mockCopyFile } });

    const commands = execaCommandMock.mock.calls.map((call) => call[0]);

    // Verify Turso export command
    expect(commands[0]).toContain('wsl bash -c');
    expect(commands[0]).toContain('~/.turso/turso db export');
    expect(commands[0]).toContain('virgil-bakery-web-prod');
    expect(commands[0]).toContain('dev.db.export');

    // Verify wsl rm for old files
    expect(commands[1]).toContain('wsl rm -f');
    expect(commands[1]).toContain('dev.db');

    // Verify copyFile was called
    expect(mockCopyFile).toHaveBeenCalledWith('dev.db.export', 'dev.db');
  });

  it('throws error when dbName is empty string', async () => {
    const { main } = await import('../../scripts/db-pull');

    // Explicitly pass empty string dbName
    await expect(main({ dbName: '' })).rejects.toThrow(
      'PROD_TURSO_DATABASE_NAME environment variable is required',
    );
  });

  it('falls back to process.env when dbName not provided', async () => {
    execaCommandMock
      .mockResolvedValueOnce({ stdout: 'Exported database to dev.db.export', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

    const { main } = await import('../../scripts/db-pull');

    await main({ fs: { existsSync: mockExistsSync, rm: mockRm, copyFile: mockCopyFile } });

    // Should use env var value
    const commands = execaCommandMock.mock.calls.map((call) => call[0]);
    expect(commands[0]).toContain('virgil-bakery-web-prod');
  });

  it('accepts custom devDbPath', async () => {
    execaCommandMock
      .mockResolvedValueOnce({ stdout: 'Exported database to test.db.export', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

    const { main } = await import('../../scripts/db-pull');

    await main({ devDbPath: 'test.db', fs: { existsSync: mockExistsSync, rm: mockRm, copyFile: mockCopyFile } });

    expect(mockCopyFile).toHaveBeenCalledWith('test.db.export', 'test.db');

    const commands = execaCommandMock.mock.calls.map((call) => call[0]);
    expect(commands[0]).toContain('test.db.export');
  });

  it('only reads from Turso, never writes to production', async () => {
    execaCommandMock
      .mockResolvedValueOnce({ stdout: 'Exported database to dev.db.export', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

    const { main } = await import('../../scripts/db-pull');

    await main({ fs: { existsSync: mockExistsSync, rm: mockRm, copyFile: mockCopyFile } });

    const commands = execaCommandMock.mock.calls.map((call) => call[0]);

    // All commands are read from Turso or local file operations
    commands.forEach((cmd) => {
      expect(cmd).not.toContain('db shell');
      expect(cmd).not.toContain('INSERT');
      expect(cmd).not.toContain('UPDATE');
      expect(cmd).not.toContain('DELETE');
      expect(cmd).not.toContain('libsql://');
    });
  });
});