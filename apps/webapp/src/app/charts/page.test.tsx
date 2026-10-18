import {afterEach, describe, expect, it, vi} from 'vitest';
import ChartsPage, {generateMetadata} from './page';

vi.mock('@/lib/i18n/server', () => ({
  getAppTranslations: async () => (source: string) => source,
}));

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
  it('preserves the English metadata', async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: 'Charts | Budget Buddy',
      description: 'Recharts chart gallery for financial data.',
    });
  });

  it('returns not found in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => ChartsPage()).toThrow('NEXT_NOT_FOUND');
  });

  it('keeps the showcase available in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(ChartsPage()).not.toBeNull();
  });
});
