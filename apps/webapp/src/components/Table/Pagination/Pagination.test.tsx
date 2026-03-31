import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {Pagination} from './Pagination';

describe('Pagination', () => {
  it('renders without crashing', () => {
    const {container} = render(
      <Pagination count={100} page={0} rowsPerPage={10} onPageChange={vi.fn()} onRowsPerPageChange={vi.fn()} />,
    );
    expect(container).not.toBeEmptyDOMElement();
  });

  it('displays the total count', () => {
    render(<Pagination count={250} page={0} rowsPerPage={10} onPageChange={vi.fn()} onRowsPerPageChange={vi.fn()} />);
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it('calls onPageChange when the next page button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination count={100} page={0} rowsPerPage={10} onPageChange={onPageChange} onRowsPerPageChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Go to next page'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange when the previous page button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination count={100} page={1} rowsPerPage={10} onPageChange={onPageChange} onRowsPerPageChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByTitle('Go to previous page'));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('calls onRowsPerPageChange when rows per page is changed', () => {
    const onRowsPerPageChange = vi.fn();
    render(
      <Pagination
        count={100}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={onRowsPerPageChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', {name: '25'}));
    expect(onRowsPerPageChange).toHaveBeenCalledWith(25);
  });

  it('renders "Rows:" as the label for rows per page', () => {
    render(<Pagination count={50} page={0} rowsPerPage={10} onPageChange={vi.fn()} onRowsPerPageChange={vi.fn()} />);
    expect(screen.getByText('Rows:')).toBeInTheDocument();
  });
});
