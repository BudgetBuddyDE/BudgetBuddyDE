import {cleanup, render, screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {afterEach, describe, expect, it} from 'vite-plus/test';
import messages from '@/i18n/messages/en-US.json';
import {CurrencyContext} from '@/utils/Formatter/PreferenceContext';
import {buildReport, metric} from '../InsightsReport.fixtures';
import {InsightsReportSummaryCards} from './InsightsReportSummaryCards';

afterEach(() => cleanup());

const renderSummary = (summary = buildReport().summary, currency: 'EUR' | 'USD' = 'EUR') =>
  render(
    <NextIntlClientProvider locale="en-US" messages={messages}>
      <CurrencyContext.Provider value={currency}>
        <InsightsReportSummaryCards summary={summary} />
      </CurrencyContext.Provider>
    </NextIntlClientProvider>,
  );

describe('InsightsReportSummaryCards', () => {
  it('renders all summary labels', () => {
    renderSummary();

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net. cash flow')).toBeInTheDocument();
    expect(screen.getByText('Savings rate')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Average expense')).toBeInTheDocument();
  });

  it('formats currency values in English locale', () => {
    renderSummary();

    expect(screen.getByText(/1,200\.00/)).toBeInTheDocument();
    // The expenses value feeds both the Expenses and Average expense cards
    expect(screen.getAllByText(/300\.00/)).toHaveLength(2);
    expect(screen.getByText(/900\.00/)).toBeInTheDocument();
  });

  it('formats summary values in the selected USD currency', () => {
    renderSummary(buildReport().summary, 'USD');

    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
  });

  it('formats percent values with one fractional digit in English locale', () => {
    renderSummary();
    expect(screen.getByText('21.5%')).toBeInTheDocument();
  });

  it('formats the savings rate as percentage', () => {
    renderSummary();

    expect(screen.getByText('21.5%')).toBeInTheDocument();
  });

  it('formats the transaction count as plain number', () => {
    renderSummary();

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders positive percent changes with a plus sign', () => {
    renderSummary();

    expect(screen.getByText('+10.0%')).toBeInTheDocument();
    expect(screen.getByText('+15.0%')).toBeInTheDocument();
  });

  it('renders negative percent changes with a minus sign', () => {
    render(
      <NextIntlClientProvider locale="en-US" messages={messages}>
        <CurrencyContext.Provider value="EUR">
          <InsightsReportSummaryCards summary={buildReport().summary} />
        </CurrencyContext.Provider>
      </NextIntlClientProvider>,
    );

    // Expenses and Average expense share the same metric
    expect(screen.getAllByText('-5.0%')).toHaveLength(2);
  });

  it('omits the change information when no previous value exists', () => {
    const summary = {
      ...buildReport().summary,
      income: metric(1200, null, null),
      expenses: metric(300, null, null),
      balance: metric(900, null, null),
      savingsRate: metric(21.5, null, null),
      transactionCount: metric(42, null, null),
      averageExpense: metric(30, null, null),
    };
    renderSummary(summary);

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('renders one card per summary metric', () => {
    const {container} = renderSummary();

    expect(container.querySelectorAll('h5')).toHaveLength(6);
  });
});
