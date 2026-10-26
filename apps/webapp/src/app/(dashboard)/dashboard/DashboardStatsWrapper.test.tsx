import {NextIntlClientProvider} from 'next-intl';
import {afterEach, describe, expect, it} from 'vite-plus/test';
import messages from '@/i18n/messages/en-US.json';
import {cleanup, render, screen} from '@/test/testing-library';
import {CurrencyContext} from '@/utils/Formatter/PreferenceContext';
import {DashboardStatsWrapper} from './DashboardStatsWrapper';

afterEach(() => cleanup());

const estimated = {
  income: {received: 1200, upcoming: 100},
  expenses: {paid: 300, upcoming: 50},
  freeAmount: 950,
};

function renderStats(currency: 'EUR' | 'USD' = 'EUR') {
  return render(
    <NextIntlClientProvider locale="en-US" messages={messages}>
      <CurrencyContext.Provider value={currency}>
        <DashboardStatsWrapper estimated={estimated} />
      </CurrencyContext.Provider>
    </NextIntlClientProvider>,
  );
}

describe('DashboardStatsWrapper', () => {
  it('renders dashboard figures in the selected currency', () => {
    const {rerender} = renderStats('EUR');

    expect(screen.getByText('€1,200.00')).toBeInTheDocument();
    expect(screen.getByText('€300.00')).toBeInTheDocument();
    expect(screen.getByText('€900.00')).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <CurrencyContext.Provider value="USD">
          <DashboardStatsWrapper estimated={estimated} />
        </CurrencyContext.Provider>
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    expect(screen.getByText('$900.00')).toBeInTheDocument();
  });
});
