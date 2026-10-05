import {account, apikey, session, user} from '@budgetbuddyde/db/auth';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({select: vi.fn(), eq: vi.fn(), getSession: vi.fn()}));
vi.mock('./db', () => ({db: {select: mocks.select}}));
vi.mock('./auth', () => ({auth: {api: {getSession: mocks.getSession}}}));
vi.mock('drizzle-orm', async importOriginal => ({
  ...(await importOriginal<typeof import('drizzle-orm')>()),
  eq: mocks.eq,
}));
import {authExportHandler} from './authExport';

function response() {
  return {set: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis(), send: vi.fn(), json: vi.fn()};
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({user: {id: 'owner'}});
  mocks.eq.mockImplementation((column, id) => ({column, id}));
});

describe('authentication export database boundary', () => {
  it('scopes all four queries to the authenticated owner and selects no credentials', async () => {
    const queries: Array<{table: unknown; condition: unknown}> = [];
    const results = [[{id: 'owner', name: 'Ada'}], [], [], []];
    mocks.select.mockImplementation(() => ({
      from(table: unknown) {
        return {
          where(condition: unknown) {
            queries.push({table, condition});
            return Promise.resolve(results[queries.length - 1]);
          },
        };
      },
    }));
    const res = response();
    await authExportHandler({headers: {'x-api-key': 'api-key'}, query: {}} as never, res as never, vi.fn());
    expect(mocks.getSession).toHaveBeenCalledWith({headers: expect.any(Headers)});
    const headers = mocks.getSession.mock.calls[0]![0].headers;
    expect(headers.get('x-api-key')).toBe('api-key');
    expect(queries.map(query => query.table)).toEqual([user, session, account, apikey]);
    expect(mocks.eq.mock.calls).toEqual([
      [user.id, 'owner'],
      [session.userId, 'owner'],
      [account.userId, 'owner'],
      [apikey.referenceId, 'owner'],
    ]);
    const selections = mocks.select.mock.calls.map(([selection]) => Object.keys(selection));
    expect(selections[1]).not.toContain('token');
    expect(selections[2]).not.toEqual(expect.arrayContaining(['password', 'accessToken', 'refreshToken', 'idToken']));
    for (const secret of ['password', 'accessToken', 'refreshToken', 'idToken'])
      expect(selections[2]).not.toContain(secret);
    expect(selections[3]).not.toContain('key');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Buffer.isBuffer(res.send.mock.calls[0]![0])).toBe(true);
  });

  it('returns a generic error if the authenticated user no longer exists', async () => {
    mocks.select.mockReturnValue({from: () => ({where: () => Promise.resolve([])})});
    const res = response();
    await authExportHandler({headers: {}, query: {}} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({error: 'Failed to export authentication data'});
    expect(res.send).not.toHaveBeenCalled();
  });

  it('never queries data when no authenticated session exists', async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = response();
    await authExportHandler({headers: {}, query: {}} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.select).not.toHaveBeenCalled();
  });
});
