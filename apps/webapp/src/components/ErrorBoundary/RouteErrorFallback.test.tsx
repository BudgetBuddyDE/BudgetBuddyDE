import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {RouteErrorFallback} from './RouteErrorFallback';

describe('RouteErrorFallback', () => {
  it('shows a safe section error and allows retrying', () => {
    const reset = vi.fn();

    render(<RouteErrorFallback error={new Error('backend details')} reset={reset} title="Transactions unavailable" />);

    expect(screen.getByRole('heading', {name: 'Transactions unavailable'})).toBeInTheDocument();
    expect(screen.getByText('We could not load this section')).toBeInTheDocument();
    expect(screen.queryByText('backend details')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(reset).toHaveBeenCalledOnce();
  });
});
