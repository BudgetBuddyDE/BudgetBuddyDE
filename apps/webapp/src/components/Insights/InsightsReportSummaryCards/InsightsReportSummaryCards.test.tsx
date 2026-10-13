import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {buildReport, metric} from '../InsightsReport.fixtures';
import {InsightsReportSummaryCards} from './InsightsReportSummaryCards';

afterEach(() => cleanup());

describe('InsightsReportSummaryCards', () => {
  it('renders all summary labels', () => {
    render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net. cash flow')).toBeInTheDocument();
    expect(screen.getByText('Savings rate')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Average expense')).toBeInTheDocument();
  });

  it('formats currency values in German locale', () => {
    render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(screen.getByText(/1\.200,00/)).toBeInTheDocument();
    // The expenses value feeds both the Expenses and Average expense cards
    expect(screen.getAllByText(/300,00/)).toHaveLength(2);
    expect(screen.getByText(/900,00/)).toBeInTheDocument();
  });

  it('formats the savings rate as percentage', () => {
    render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(screen.getByText('21.5%')).toBeInTheDocument();
  });

  it('formats the transaction count as plain number', () => {
    render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders positive percent changes with a plus sign', () => {
    render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(screen.getByText('+10.0%')).toBeInTheDocument();
    expect(screen.getByText('+15.0%')).toBeInTheDocument();
  });

  it('renders negative percent changes with a minus sign', () => {
    render(<InsightsReportSummaryCards summary={buildReport().summary} />);

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
    render(<InsightsReportSummaryCards summary={summary} />);

    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('renders one card per summary metric', () => {
    const {container} = render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(container.querySelectorAll('h5')).toHaveLength(6);
  });
});
