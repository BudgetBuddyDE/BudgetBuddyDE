import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {Pagination} from './pagination';

describe('Pagination', () => {
  it('shows the current range and moves through valid pages', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={2}
        pageSize={25}
        totalCount={70}
        onPageChange={onPageChange}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(screen.getByText('26–50 of 70')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Previous'}));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', {name: 'Next'}));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('resets page size through a typed value and blocks invalid navigation', () => {
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        page={1}
        pageSize={25}
        totalCount={2}
        onPageChange={() => undefined}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    expect(screen.getByRole('button', {name: 'Previous'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Next'})).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Rows'), {target: {value: '50'}});
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
