import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {buildReport, metric} from '../InsightsReport.fixtures';
import {InsightsReportAnalysis} from './InsightsReportAnalysis';

vi.mock('@budgetbuddyde/charts', () => ({
  BarChart: ({ariaLabel, axisValueFormatter}: {ariaLabel: string; axisValueFormatter: (value: number) => string}) => (
    <div role="img" aria-label={ariaLabel} data-axis-label={axisValueFormatter(100)} />
  ),
  BulletChart: () => <div />,
}));

afterEach(() => cleanup());

describe('InsightsReportAnalysis', () => {
  it('renders category rows with the selected expenses metric by default', () => {
    const report = buildReport();
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);

    expect(screen.getByText('Category analysis')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Housing')).toBeInTheDocument();
    // "Selected metric" column mirrors expenses for the default metric
    expect(screen.getAllByText(/120,50/)).toHaveLength(2);
    expect(screen.getAllByText(/95,00/)).toHaveLength(2);
    expect(screen.getByText('40.2%')).toBeInTheDocument();
    expect(screen.getByRole('img', {name: 'Category amounts compared with the previous period'})).toHaveAttribute(
      'data-axis-label',
      expect.stringContaining('100,00'),
    );
  });

  it('recomputes the selected metric column when the metric changes', () => {
    const report = buildReport();
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Metric'}));
    fireEvent.click(screen.getByRole('option', {name: 'Income'}));

    // Income column and the "Selected metric" column both show the income value
    expect(screen.getAllByText(/600,00/)).toHaveLength(2);
    expect(screen.getAllByText(/400,00/)).toHaveLength(2);
    expect(screen.getAllByText(/120,50/)).toHaveLength(1);
  });

  it('sorts payment methods by usage count by default', () => {
    const report = buildReport();
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);

    const rows = screen
      .getAllByRole('row')
      .filter(row => row.textContent?.includes('Card') || row.textContent?.includes('Cash'));
    expect(rows[0]).toHaveTextContent('Card');
    expect(rows[1]).toHaveTextContent('Cash');
  });

  it('re-sorts payment methods by expenses volume', () => {
    const report = buildReport();
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Rank by'}));
    fireEvent.click(screen.getByRole('option', {name: 'Expenses'}));

    const rows = screen
      .getAllByRole('row')
      .filter(row => row.textContent?.includes('Card') || row.textContent?.includes('Cash'));
    expect(rows[0]).toHaveTextContent('Cash');
    expect(rows[1]).toHaveTextContent('Card');
  });

  it('renders the budget health card when budgets exist', () => {
    const report = buildReport({
      budgets: [
        {
          id: '01900000-0000-7000-8000-000000000001',
          name: 'Groceries budget',
          budget: 300,
          spent: 210,
          remaining: 90,
          utilization: 70,
          overBudget: false,
        },
      ],
    });
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);

    expect(screen.getByText('Current month budget health')).toBeInTheDocument();
    expect(screen.getByText('Groceries budget')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
  });

  it('omits the budget health card when no budgets are reported', () => {
    const report = buildReport({budgets: null});
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);

    expect(screen.queryByText('Current month budget health')).not.toBeInTheDocument();
  });

  it('renders an empty state for the category table without matching rows', () => {
    const report = buildReport();
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={[]} />);

    expect(screen.getAllByText('No data for the selected filters.').length).toBeGreaterThan(0);
  });

  it('preserves date and payment filters in category drill-down links', () => {
    const report = buildReport({comparisonPeriod: null});
    render(
      <InsightsReportAnalysis
        report={report}
        selectedCategoryRows={report.categories}
        reportQuery={{
          $dateFrom: new Date(2026, 1, 1),
          $dateTo: new Date(2026, 1, 28),
          $paymentMethods: ['pm-1'],
        }}
      />,
    );
    const link = screen.getByRole('link', {name: 'Groceries'});
    const params = new URL(link.getAttribute('href')!, 'https://example.test').searchParams;
    expect(params.get('dateFrom')).toBe('2026-02-01');
    expect(params.get('cat')).toBe('cat-1');
    expect(params.get('pm')).toBe('pm-1');
    expect(screen.getByText('Largest amounts in the selected period')).toBeInTheDocument();
  });

  it('shows positive expense receivers and labels the count as all transactions', () => {
    const report = buildReport({
      receivers: [
        {receiver: 'Shop & Sons', expenses: metric(80), transactionCount: metric(3), averageExpense: metric(40)},
        {receiver: 'Employer', expenses: metric(0), transactionCount: metric(1), averageExpense: metric(0)},
      ],
    });
    render(<InsightsReportAnalysis report={report} selectedCategoryRows={report.categories} />);
    const link = screen.getByRole('link', {name: 'Shop & Sons'});
    expect(new URL(link.getAttribute('href')!, 'https://example.test').searchParams.get('q')).toBe('Shop & Sons');
    expect(screen.queryByText('Employer')).not.toBeInTheDocument();
    expect(screen.getByText(/Counts include all transactions/)).toBeInTheDocument();
  });
});
