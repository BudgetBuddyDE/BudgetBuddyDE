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
    expect(screen.getByText(/300,00/)).toBeInTheDocument();
    expect(screen.getByText(/^30,00/)).toBeInTheDocument();
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

    expect(screen.getByText('-5.0%')).toBeInTheDocument();
    expect(screen.getByText('-2.0%')).toBeInTheDocument();
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

  it('marks a savings rate without income as unavailable', () => {
    const summary = {...buildReport().summary, income: metric(0), savingsRate: metric(0, 100, 20)};
    render(<InsightsReportSummaryCards summary={summary} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText('No recorded income')).toBeInTheDocument();
    expect(screen.queryByText('+100.0%')).not.toBeInTheDocument();
  });

  it('adds expense and cashflow trends only with multiple buckets', () => {
    const timeline = [
      buildReport().timeline[0],
      {...buildReport().timeline[0], label: 'Feb 2026', expenses: 40, balance: -20},
    ];
    const {rerender} = render(<InsightsReportSummaryCards summary={buildReport().summary} timeline={timeline} />);
    expect(screen.getByRole('img', {name: /Expenses trend: Jan 2026/})).toBeInTheDocument();
    expect(screen.getByRole('img', {name: /Net. cash flow trend: Jan 2026/})).toBeInTheDocument();
    expect(screen.getAllByText(/Trend in selected period/)).toHaveLength(2);
    rerender(<InsightsReportSummaryCards summary={buildReport().summary} timeline={timeline.slice(0, 1)} />);
    expect(screen.queryByText(/Trend in selected period/)).not.toBeInTheDocument();
  });

  it('renders one card per summary metric', () => {
    const {container} = render(<InsightsReportSummaryCards summary={buildReport().summary} />);

    expect(container.querySelectorAll('h5')).toHaveLength(6);
  });
});
