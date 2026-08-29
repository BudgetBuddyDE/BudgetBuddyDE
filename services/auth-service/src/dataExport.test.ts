import {describe, expect, it, vi} from 'vitest';
import {createAuthExportArchive, createAuthExportHandler, type TAuthExportData} from './dataExport';

function readStoredZipEntries(archive: Buffer): Record<string, string> {
  const entries: Record<string, string> = {};
  let offset = 0;

  while (archive.readUInt32LE(offset) === 0x04034b50) {
    expect(archive.readUInt16LE(offset + 8)).toBe(0);
    const compressedSize = archive.readUInt32LE(offset + 18);
    const nameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const name = archive.subarray(nameStart, nameStart + nameLength).toString('utf8');
    entries[name] = archive.subarray(contentStart, contentStart + compressedSize).toString('utf8');
    offset = contentStart + compressedSize;
  }

  return entries;
}

const exportData: TAuthExportData = {
  user: {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  },
  sessions: [
    {
      id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date('2026-02-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      token: 'session-token-must-not-export',
    },
  ],
  accounts: [
    {
      id: 'account-1',
      accountId: 'github-user-1',
      providerId: 'github',
      userId: 'user-1',
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: 'read:user',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      accessToken: 'oauth-access-token-must-not-export',
      refreshToken: 'oauth-refresh-token-must-not-export',
      idToken: 'oauth-id-token-must-not-export',
      password: 'password-hash-must-not-export',
    },
  ],
  apiKeys: [
    {
      id: 'api-key-1',
      name: 'CLI',
      referenceId: 'user-1',
      enabled: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      expiresAt: null,
      rateLimitEnabled: true,
      rateLimitTimeWindow: 60_000,
      rateLimitMax: 100,
      requestCount: 3,
      remaining: 97,
      lastRequest: null,
      key: 'api-key-hash-must-not-export',
    },
  ],
};

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

describe('auth export', () => {
  it('creates a JSON archive containing only the selected safe fields and manifest', () => {
    const archive = createAuthExportArchive(exportData, 'json', new Date('2026-03-01T00:00:00.000Z'));
    const entries = readStoredZipEntries(archive);
    const text = archive.toString('utf8');

    expect(Object.keys(entries)).toEqual([
      'user.json',
      'sessions.json',
      'accounts.json',
      'api-keys.json',
      'manifest.json',
    ]);
    expect(JSON.parse(entries['manifest.json']!)).toMatchObject({
      schemaVersion: 1,
      archiveFormat: 'zip',
      format: 'json',
      exportedAt: '2026-03-01T00:00:00.000Z',
    });
    expect(JSON.parse(entries['sessions.json']!)[0]).not.toHaveProperty('token');
    expect(JSON.parse(entries['accounts.json']!)[0]).not.toHaveProperty('accessToken');
    expect(JSON.parse(entries['accounts.json']!)[0]).not.toHaveProperty('password');
    expect(JSON.parse(entries['api-keys.json']!)[0]).not.toHaveProperty('key');
    expect(text).not.toContain('session-token-must-not-export');
    expect(text).not.toContain('oauth-access-token-must-not-export');
    expect(text).not.toContain('oauth-refresh-token-must-not-export');
    expect(text).not.toContain('oauth-id-token-must-not-export');
    expect(text).not.toContain('password-hash-must-not-export');
    expect(text).not.toContain('api-key-hash-must-not-export');
  });

  it('validates the incoming session and returns a no-store CSV ZIP download', async () => {
    const getSession = vi.fn().mockResolvedValue({user: {id: 'user-1'}});
    const getData = vi.fn().mockResolvedValue(exportData);
    const handler = createAuthExportHandler({getSession, getData});
    const response = createResponse();

    await handler(
      {headers: {cookie: 'budget-buddy.session_token=valid'}, query: {format: 'csv'}} as never,
      response as never,
      vi.fn(),
    );

    expect(getSession).toHaveBeenCalledWith(expect.any(Headers));
    expect(getData).toHaveBeenCalledWith('user-1');
    expect(response.set).toHaveBeenCalledWith({'Cache-Control': 'no-store', Pragma: 'no-cache'});
    expect(response.set).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/zip',
        'Content-Disposition': expect.stringContaining('attachment; filename='),
      }),
    );
    const entries = readStoredZipEntries(response.send.mock.calls[0]![0]);
    expect(entries['user.csv']).toContain('id,name,email,emailVerified,image,createdAt,updatedAt');
    expect(entries['sessions.csv']).not.toContain('session-token-must-not-export');
  });

  it('neutralizes formulas in CSV values', () => {
    const archive = createAuthExportArchive(
      {...exportData, user: {...exportData.user, name: '=HYPERLINK("https://example.com")'}},
      'csv',
    );

    expect(readStoredZipEntries(archive)['user.csv']).toContain(`"'=HYPERLINK(""https://example.com"")"`);
  });

  it('rejects unauthenticated export requests', async () => {
    const getData = vi.fn();
    const handler = createAuthExportHandler({getSession: vi.fn().mockResolvedValue(null), getData});
    const response = createResponse();

    await handler({headers: {}, query: {}} as never, response as never, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({error: 'Unauthorized'});
    expect(getData).not.toHaveBeenCalled();
  });
});
