import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {buildReport, buildTransaction, categoryOption} from '../InsightsReport.fixtures';
import {InsightsReportView} from './InsightsReportView';

vi.mock('@/components/Charts', () => ({
  BarLineChart: () => <div>timeline chart</div>,
}));

afterEach(() => cleanup());

const report = buildReport();
const transactions = [buildTransaction(1)];

describe('InsightsReportView', () => {
  it('renders a skeleton while the report is loading for the first time', () => {
    const {container} = render(
      <InsightsReportView
        report={null}
        error={null}
        loading
        categories={[]}
        transactions={[]}
        transactionCount={0}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={vi.fn()}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByText('Income')).not.toBeInTheDocument();
  });

  it('renders an error alert and no report', () => {
    render(
      <InsightsReportView
        report={null}
        error={new Error('Report failed to load')}
        loading={false}
        categories={[]}
        transactions={[]}
        transactionCount={0}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={vi.fn()}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Report failed to load')).toBeInTheDocument();
    expect(screen.queryByText('Income')).not.toBeInTheDocument();
  });

  it('shows a refresh indicator while a loaded report refreshes', () => {
    render(
      <InsightsReportView
        report={report}
        error={null}
        loading
        categories={[]}
        transactions={transactions}
        transactionCount={1}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={vi.fn()}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar', {name: 'Refreshing insights report'})).toBeInTheDocument();
    expect(screen.getByText('Category analysis')).toBeInTheDocument();
  });

  it('renders the report sections once data is available', () => {
    render(
      <InsightsReportView
        report={report}
        error={null}
        loading={false}
        categories={[]}
        transactions={transactions}
        transactionCount={1}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={vi.fn()}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Income, expenses and balance')).toBeInTheDocument();
    expect(screen.getByText('Accumulated expenses')).toBeInTheDocument();
    expect(screen.getByText('Category analysis')).toBeInTheDocument();
    expect(screen.getByText('Payment method usage')).toBeInTheDocument();
    expect(screen.getByText('Executed transactions (1)')).toBeInTheDocument();
    expect(screen.getAllByText('timeline chart')).toHaveLength(2);
  });

  it('omits the budget card when the report has no budgets', () => {
    render(
      <InsightsReportView
        report={report}
        error={null}
        loading={false}
        categories={[]}
        transactions={[]}
        transactionCount={0}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={vi.fn()}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('Current month budget health')).not.toBeInTheDocument();
  });

  it('limits the category analysis to the selected categories', () => {
    render(
      <InsightsReportView
        report={report}
        error={null}
        loading={false}
        categories={[categoryOption('cat-1', 'Groceries')]}
        transactions={[]}
        transactionCount={0}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={vi.fn()}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Housing')).not.toBeInTheDocument();
  });

  it('keeps the transaction pagination interactive', () => {
    const setTransactionPage = vi.fn();
    render(
      <InsightsReportView
        report={report}
        error={null}
        loading={false}
        categories={[]}
        transactions={transactions}
        transactionCount={20}
        transactionPage={0}
        transactionRowsPerPage={10}
        onTransactionPageChange={setTransactionPage}
        onTransactionRowsPerPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTitle('Go to previous page')).toBeDisabled();
    expect(screen.getByTitle('Go to next page')).toBeEnabled();
  });
});
