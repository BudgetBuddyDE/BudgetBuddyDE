import {NextIntlClientProvider} from 'next-intl';
import {describe, expect, it} from 'vite-plus/test';
import messages from '@/i18n/messages/en-US.json';
import {fireEvent, render, screen} from '@/test/testing-library';
import {CurrencyContext} from '@/utils/Formatter/PreferenceContext';
import {BudgetOverviewCard} from './BudgetOverviewCard';

const renderCard = (props: React.ComponentProps<typeof BudgetOverviewCard>, currency: 'EUR' | 'USD' = 'EUR') =>
  render(
    <NextIntlClientProvider locale="en-US" messages={messages}>
      <CurrencyContext.Provider value={currency}>
        <BudgetOverviewCard {...props} />
      </CurrencyContext.Provider>
    </NextIntlClientProvider>,
  );

describe('BudgetOverviewCard', () => {
  it('renders the budget breakdown', () => {
    renderCard({totalBudget: 200, spent: 100, futureExpenses: 40});

    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText(/200\.00/)).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Expenses')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(/60\.00/)).toBeInTheDocument();
  });

  it('renders the overdrawn state', () => {
    renderCard({totalBudget: 100, spent: 80, futureExpenses: 40});

    expect(screen.getByText('Overdrawn')).toBeInTheDocument();
    expect(screen.getByText(/20\.00/)).toBeInTheDocument();
  });

  it('renders a zero budget without invalid percentage values', () => {
    renderCard({totalBudget: 0, spent: 0, futureExpenses: 0});

    expect(screen.getByLabelText('Budget progress')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getAllByText(/0\.00/)).not.toHaveLength(0);
  });

  it('shows progress tooltips when hovering the budget segments', async () => {
    renderCard({totalBudget: 200, spent: 100, futureExpenses: 40});

    fireEvent.mouseOver(screen.getByLabelText('Spent'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/Spent/);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/100\.00/);
  });

  it('formats the available tooltip in the selected currency', async () => {
    renderCard({totalBudget: 200, spent: 100, futureExpenses: 40}, 'USD');

    fireEvent.mouseOver(screen.getByLabelText('Available'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('$60.00');
  });
});
