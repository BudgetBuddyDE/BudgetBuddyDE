import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {cleanup, render, screen} from '@/test/testing-library';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

const {getTranslations, getFormatter, preferenceGet, cookies} = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  getFormatter: vi.fn(),
  preferenceGet: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('next-intl/server', () => ({getTranslations, getFormatter}));
vi.mock('next/headers', () => ({headers: vi.fn(), cookies}));
vi.mock('@/apiClient', () => ({apiClient: {backend: {preference: {get: preferenceGet}}}}));

afterEach(() => cleanup());

const estimated = {
  income: {received: 1200, upcoming: 100},
  expenses: {paid: 300, upcoming: 50},
  freeAmount: 950,
};

async function renderStats(currency: 'EUR' | 'USD' = 'EUR') {
  getTranslations.mockResolvedValue((key: string) => key);
  getFormatter.mockResolvedValue({number: (value: number, options: Intl.NumberFormatOptions) =>
    value.toLocaleString('en-US', options),
  });
  preferenceGet.mockResolvedValue([{data: {currency}}, null]);
  cookies.mockResolvedValue({get: () => undefined});
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
});
