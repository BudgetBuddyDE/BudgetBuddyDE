import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {ErrorView} from './error-view';

describe('ErrorView', () => {
  it('offers a retry without exposing an internal error', () => {
    const reset = vi.fn();
    render(<ErrorView title="Dashboard unavailable" reset={reset} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Dashboard unavailable');
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(reset).toHaveBeenCalledOnce();
  });
});
