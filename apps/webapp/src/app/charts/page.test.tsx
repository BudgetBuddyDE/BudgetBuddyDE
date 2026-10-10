import {afterEach, describe, expect, it, vi} from 'vitest';
import ChartsPage from './page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/components/ChartsShowcase/ChartsShowcase', () => ({
  ChartsShowcase: () => null,
}));

afterEach(() => vi.unstubAllEnvs());

describe('charts route access', () => {
  it('returns not found in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => ChartsPage()).toThrow('NEXT_NOT_FOUND');
  });

  it('keeps the showcase available in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(ChartsPage()).not.toBeNull();
  });
});
