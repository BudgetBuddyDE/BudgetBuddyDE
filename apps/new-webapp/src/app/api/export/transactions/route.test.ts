import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({session: vi.fn(), getAll: vi.fn()}));
vi.mock('next/headers', () => ({headers: async () => new Headers({cookie: 'session=test'})}));
vi.mock('@/authClient', () => ({authClient: {getSession: mocks.session}}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {transaction: {getAll: mocks.getAll}}}}));
import {GET} from './route';

describe('transaction export route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated exports', async () => {
    mocks.session.mockResolvedValue({data: null, error: {message: 'unauthorized'}});
    const response = await GET(new Request('http://local/api/export/transactions?format=csv&period=2026-07'));
    expect(response.status).toBe(401);
    expect(mocks.getAll).not.toHaveBeenCalled();
  });

  it('returns private CSV and neutralizes spreadsheet formulas', async () => {
    mocks.session.mockResolvedValue({data: {user: {id: 'u'}}, error: null});
    mocks.getAll.mockResolvedValue([
      {
        data: [
          {
            id: 't',
            processedAt: new Date('2026-07-01'),
            transferAmount: -10,
            receiver: '=IMPORTXML()',
            information: null,
            category: {name: 'Food'},
            paymentMethod: {name: 'Card'},
          },
        ],
        totalCount: 1,
      },
      null,
    ]);
    const response = await GET(new Request('http://local/api/export/transactions?format=csv&period=2026-07'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-disposition')).toContain('2026-07.csv');
    expect(await response.text()).toContain("'=IMPORTXML()");
  });

  it('forwards current table filters to the export query', async () => {
    mocks.session.mockResolvedValue({data: {user: {id: 'u'}}, error: null});
    mocks.getAll.mockResolvedValue([{data: [], totalCount: 0}, null]);
    const response = await GET(
      new Request('http://local/api/export/transactions?format=csv&scope=filtered&search=rent&type=expense'),
    );
    expect(response.status).toBe(200);
    expect(mocks.getAll).toHaveBeenCalledWith(
      expect.objectContaining({search: 'rent', $type: 'expense'}),
      expect.anything(),
    );
  });

  it('rejects malformed ranges before data access', async () => {
    mocks.session.mockResolvedValue({data: {user: {id: 'u'}}, error: null});
    const response = await GET(new Request('http://local/api/export/transactions?format=json&period=July'));
    expect(response.status).toBe(400);
    expect(mocks.getAll).not.toHaveBeenCalled();
  });
});
