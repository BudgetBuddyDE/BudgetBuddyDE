import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  transaction: vi.fn(),
  category: vi.fn(),
  paymentMethod: vi.fn(),
  budget: vi.fn(),
  recurring: vi.fn(),
}));
vi.mock('next/headers', () => ({headers: async () => new Headers({cookie: 'session=test'})}));
vi.mock('@/authClient', () => ({authClient: {getSession: mocks.session}}));
vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      transaction: {getAll: mocks.transaction},
      category: {getAll: mocks.category},
      paymentMethod: {getAll: mocks.paymentMethod},
      budget: {getAll: mocks.budget},
      recurringPayment: {getAll: mocks.recurring},
    },
  },
}));
import {GET} from './route';

describe('user data export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [mocks.transaction, mocks.category, mocks.paymentMethod, mocks.budget, mocks.recurring])
      mock.mockResolvedValue([{data: [], totalCount: 0}, null]);
  });
  it('requires a session', async () => {
    mocks.session.mockResolvedValue({data: null, error: {message: 'unauthorized'}});
    expect((await GET()).status).toBe(401);
  });
  it('exports private domain data without session or API-key secrets', async () => {
    mocks.session.mockResolvedValue({
      data: {user: {id: 'u', name: 'Ada', email: 'ada@example.com'}, session: {token: 'secret'}},
      error: null,
    });
    const response = await GET();
    const archive = await response.json();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(archive).toMatchObject({version: 1, user: {id: 'u'}, transactions: [], budgets: []});
    expect(JSON.stringify(archive)).not.toContain('secret');
    expect(archive).not.toHaveProperty('apiKeys');
  });
  it('fails the archive atomically when a source is unavailable', async () => {
    mocks.session.mockResolvedValue({data: {user: {id: 'u'}}, error: null});
    mocks.budget.mockResolvedValue([null, {message: 'failed'}]);
    expect((await GET()).status).toBe(502);
  });
});
