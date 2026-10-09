import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {Pagination, type PaginationProps} from './Pagination';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

function renderPagination(overrides: Partial<PaginationProps> = {}) {
  const props: PaginationProps = {
    count: 32,
    page: 0,
    rowsPerPage: 15,
    onPageChange: vi.fn(),
    onRowsPerPageChange: vi.fn(),
    ...overrides,
  };

  return {...render(<Pagination {...props} />, {wrapper: TestProvider}), props};
}

describe('Pagination', () => {
  it('shows an empty range and disables both navigation buttons for no entries', () => {
    const {props} = renderPagination({count: 0});

    expect(screen.getByText('0–0 of 0')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    expect(props.onPageChange).not.toHaveBeenCalled();
  });

  it('shows the first page and requests the next zero-based page', () => {
    const {props} = renderPagination();

    expect(screen.getByText('1–15 of 32')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    expect(props.onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByText('1–15 of 32')).toBeInTheDocument();
  });

  it('supports previous and next navigation on an intermediate page', () => {
    const {props} = renderPagination({page: 1});

    expect(screen.getByText('16–30 of 32')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Previous page'}));
    fireEvent.click(screen.getByRole('button', {name: 'Next page'}));
    expect(props.onPageChange).toHaveBeenNthCalledWith(1, 0);
    expect(props.onPageChange).toHaveBeenNthCalledWith(2, 2);
  });

  it.each([
    {count: 32, page: 2, range: '31–32 of 32'},
    {count: 30, page: 1, range: '16–30 of 30'},
  ])('disables next navigation on the final page with $count entries', ({count, page, range}) => {
    renderPagination({count, page});

    expect(screen.getByText(range)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Previous page'})).toBeEnabled();
  });

  it('provides a labelled native select with default sizes and numeric callbacks', () => {
    const {props} = renderPagination();
    const select = screen.getByRole('combobox', {name: 'Rows:'});

    expect(select).toHaveValue('15');
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['10', '15', '25', '50', '100']);
    fireEvent.change(select, {target: {value: '10'}});
    expect(props.onRowsPerPageChange).toHaveBeenCalledWith(10);
  });

  it('accepts custom page sizes', () => {
    renderPagination({rowsPerPage: 5, rowsPerPageOptions: [5, 10]});

    expect(screen.getByRole('combobox', {name: 'Rows:'})).toHaveValue('5');
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['5', '10']);
    expect(screen.getByText('1–5 of 32')).toBeInTheDocument();
  });
});
