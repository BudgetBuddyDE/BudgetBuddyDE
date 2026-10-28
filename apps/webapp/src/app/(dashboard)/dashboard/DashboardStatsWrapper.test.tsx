import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {cleanup, render, screen} from '@/test/testing-library';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

const {getTranslations, getLocale, preferenceGet} = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  getLocale: vi.fn(),
  preferenceGet: vi.fn(),
}));

vi.mock('next-intl/server', () => ({getTranslations, getLocale}));
vi.mock('next/headers', () => ({headers: vi.fn()}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get: preferenceGet}}}}));

afterEach(() => cleanup());

const estimated = {
  income: {received: 1200, upcoming: 100},
  expenses: {paid: 300, upcoming: 50},
  freeAmount: 950,
};

async function renderStats(currency: 'EUR' | 'USD' = 'EUR', locale: 'en-US' | 'de-DE' = 'en-US') {
  getTranslations.mockResolvedValue((key: string) => key);
  getLocale.mockResolvedValue(locale);
  preferenceGet.mockResolvedValue([{data: {currency}}, null]);
  return render(await DashboardStatsWrapper({estimated}));
}

describe('DashboardStatsWrapper', () => {
  it('renders dashboard figures in the selected currency', async () => {
    await renderStats('EUR');

    expect(screen.getByText('€1,200.00')).toBeInTheDocument();
    expect(screen.getByText('€300.00')).toBeInTheDocument();
    expect(screen.getByText('€900.00')).toBeInTheDocument();

    cleanup();
    await renderStats('USD');

    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    expect(screen.getByText('$900.00')).toBeInTheDocument();
  });

  it('formats the selected currency using the active locale', async () => {
    await renderStats('EUR', 'de-DE');

    expect(screen.getByText(value => value.includes('1.200,00') && value.includes('€'))).toBeInTheDocument();
  });
});
