import {fireEvent, render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';

import {Pagination} from './Pagination.component';

const renderWithRouter = (ui: React.ReactNode, {route = '/'} = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, {wrapper: BrowserRouter});
};

describe('Pagination component', () => {
  it('should initialize page and rowsPerPage from query params', () => {
    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();

    renderWithRouter(
      <Pagination
        count={100}
        page={0}
        onPageChange={onPageChange}
        rowsPerPage={10}
        onRowsPerPageChange={onRowsPerPageChange}
      />,
      {route: '/?page=2&rpp=15'},
    );

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onRowsPerPageChange).toHaveBeenCalledWith(15);
  });

  it('should call onPageChange when page is changed', () => {
    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();

    renderWithRouter(
      <Pagination
        count={100}
        page={0}
        onPageChange={onPageChange}
        rowsPerPage={10}
        onRowsPerPageChange={onRowsPerPageChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Go to next page'));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
