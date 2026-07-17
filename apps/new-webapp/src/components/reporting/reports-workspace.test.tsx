import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {ReportsWorkspace} from './reports-workspace';
const push = vi.fn();
vi.mock('next/navigation', () => ({useRouter: () => ({push, refresh: vi.fn()})}));
const data = {
  history: [{date: new Date(2026, 0, 31), income: 100, expenses: 40, balance: 60}],
  categoryHistory: [],
  recurring: [],
} as never;

describe('ReportsWorkspace', () => {
  it('renders accessible annual trend, all calendar months, and export', () => {
    render(<ReportsWorkspace data={data} year={2026} />);
    expect(screen.getByRole('img', {name: /trend for 2026/})).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(13);
    expect(screen.getByRole('link', {name: /Export year/})).toHaveAttribute(
      'href',
      '/api/export/transactions?format=csv&year=2026',
    );
  });
  it('navigates complete years', () => {
    render(<ReportsWorkspace data={data} year={2026} />);
    fireEvent.click(screen.getByRole('button', {name: 'Previous year'}));
    expect(push).toHaveBeenCalledWith('/reports?year=2025');
  });
});
