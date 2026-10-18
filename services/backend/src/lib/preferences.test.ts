import {beforeEach, describe, expect, it, vi} from 'vitest';
import {preferences} from '@budgetbuddyde/db/backend';
import {initializePreferences} from './preferences';

const mocks = vi.hoisted(() => ({values: vi.fn(), conflict: vi.fn()}));
vi.mock('../db', () => ({db: {insert: () => ({values: mocks.values})}}));

describe('preferences initialization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.values.mockReturnValue({onConflictDoNothing: mocks.conflict});
  });

  it('uses open onboarding for new users and leaves other defaults to the database', async () => {
    await initializePreferences('new-user');
    expect(mocks.values).toHaveBeenCalledExactlyOnceWith({ownerId: 'new-user', onboardingCompleted: false});
    expect(mocks.conflict).toHaveBeenCalledExactlyOnceWith({target: preferences.ownerId});
  });

  it('can initialize legacy accounts without overwriting existing settings', async () => {
    await initializePreferences('legacy-user', true);
    expect(mocks.values).toHaveBeenCalledWith({ownerId: 'legacy-user', onboardingCompleted: true});
    expect(mocks.conflict).toHaveBeenCalledWith({target: preferences.ownerId});
  });

  it('propagates persistence failures', async () => {
    mocks.conflict.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(initializePreferences('new-user')).rejects.toThrow('Database unavailable');
  });
});
