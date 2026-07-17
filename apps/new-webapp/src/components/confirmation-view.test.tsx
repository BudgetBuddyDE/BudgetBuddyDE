import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {ConfirmationView} from './confirmation-view';

describe('ConfirmationView', () => {
  it('shows the outcome and destination action', () => {
    render(<ConfirmationView title="Email verified" description="Your address is ready." href="/dashboard" />);
    expect(screen.getByRole('heading', {name: 'Email verified'})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Continue'})).toHaveAttribute('href', '/dashboard');
  });
});
