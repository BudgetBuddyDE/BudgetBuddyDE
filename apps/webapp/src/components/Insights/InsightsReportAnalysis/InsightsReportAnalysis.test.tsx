import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {buildReport} from '../InsightsReport.fixtures';
import {InsightsReportAnalysis} from './InsightsReportAnalysis';

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
    fireEvent.click(screen.getByRole('option', {name: 'Volume'}));

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

    expect(screen.getByText('No data for the selected filters.')).toBeInTheDocument();
  });
});
