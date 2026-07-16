import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {AccountStatus} from './account-status';

describe('AccountStatus', () => {
  it('communicates account outcomes and a safe next step', () => {
    render(<AccountStatus title="Email verified" description="Your account is ready." />);
    expect(screen.getByRole('heading', {name: 'Email verified'})).toBeVisible();
    expect(screen.getByRole('link', {name: 'Continue to sign in'})).toHaveAttribute('href', '/sign-in');
  });
});
