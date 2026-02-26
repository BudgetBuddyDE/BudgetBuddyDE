import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {PasswordInput} from './PasswordInput';

describe('PasswordInput', () => {
  it('renders a password input hidden by default', () => {
    render(<PasswordInput />);
    expect(screen.getByPlaceholderText('Enter password')).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when the toggle button is clicked', () => {
    render(<PasswordInput />);
    const input = screen.getByPlaceholderText('Enter password');
    const toggle = screen.getByLabelText('toggle password visibility');

    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders a "Password" label by default', () => {
    render(<PasswordInput />);
    expect(screen.getAllByText('Password').length).toBeGreaterThan(0);
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<PasswordInput disabled />);
    expect(screen.getByPlaceholderText('Enter password')).toBeDisabled();
  });
});
