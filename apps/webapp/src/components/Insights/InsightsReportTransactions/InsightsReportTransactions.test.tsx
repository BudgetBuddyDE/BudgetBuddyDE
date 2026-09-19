import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import React from 'react';
import {afterEach, describe, expect, it} from 'vitest';
import {buildTransaction} from '../InsightsReport.fixtures';
import {InsightsReportTransactions} from './InsightsReportTransactions';

afterEach(() => cleanup());

const transactions = [buildTransaction(1), buildTransaction(2)];

type HarnessProps = {
  transactionCount: number;
  initialPage: number;
  initialRowsPerPage?: number;
};

const Harness: React.FC<HarnessProps> = ({transactionCount, initialPage, initialRowsPerPage = 10}) => {
  const [page, setPage] = React.useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = React.useState(initialRowsPerPage);
  return (
    <>
      <span data-testid="current-page">{page}</span>
      <span data-testid="current-rows-per-page">{rowsPerPage}</span>
      <InsightsReportTransactions
        transactions={transactions}
        transactionCount={transactionCount}
        transactionPage={page}
        transactionRowsPerPage={rowsPerPage}
        income={100}
        expenses={40}
        onTransactionPageChange={setPage}
        onTransactionRowsPerPageChange={nextRowsPerPage => {
          setRowsPerPage(nextRowsPerPage);
          setPage(0);
        }}
      />
    </>
  );
};

describe('InsightsReportTransactions', () => {
  it('formats the executed transaction rows', () => {
    render(<Harness transactionCount={20} initialPage={0} />);

    expect(screen.getByText('Executed transactions (20)')).toBeInTheDocument();
    expect(screen.getByText('Receiver 1')).toBeInTheDocument();
    expect(screen.getByText('Receiver 2')).toBeInTheDocument();
    expect(screen.getAllByText('01.02.2026')).toHaveLength(2);
    expect(screen.getAllByText(/42,50/)).toHaveLength(2);
    expect(screen.getAllByText('Groceries')).toHaveLength(2);
  });

  it('renders the combined volume of income and expenses', () => {
    render(<Harness transactionCount={20} initialPage={0} />);

    expect(screen.getByText(/140,00/)).toBeInTheDocument();
  });

  it('navigates to the next page and keeps the current page', () => {
    render(<Harness transactionCount={25} initialPage={0} />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
    fireEvent.click(screen.getByTitle('Go to next page'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('navigates back to the previous page', () => {
    render(<Harness transactionCount={25} initialPage={2} />);

    fireEvent.click(screen.getByTitle('Go to previous page'));

    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('disables Previous on the first page', () => {
    render(<Harness transactionCount={25} initialPage={0} />);

    expect(screen.getByTitle('Go to previous page')).toBeDisabled();
    expect(screen.getByTitle('Go to next page')).toBeEnabled();
  });

  it('disables Next on the last page', () => {
    render(<Harness transactionCount={20} initialPage={1} />);

    expect(screen.getByTitle('Go to previous page')).toBeEnabled();
    expect(screen.getByTitle('Go to next page')).toBeDisabled();
  });

  it('changes the rows per page and resets to the first page', () => {
    render(<Harness transactionCount={100} initialPage={2} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', {name: '25'}));

    expect(screen.getByTestId('current-rows-per-page')).toHaveTextContent('25');
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
  });
});
