import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it} from 'vitest';
import {ThemeToggle} from './theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('applies a saved theme when an auth page loads', async () => {
    localStorage.setItem('budgetbuddy-theme', 'dark');
    render(<ThemeToggle />);

    expect(await screen.findByRole('button', {name: 'Use light theme'})).toBeVisible();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles and persists the theme', async () => {
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', {name: 'Use dark theme'}));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('budgetbuddy-theme')).toBe('dark');
    expect(screen.getByRole('button', {name: 'Use light theme'})).toBeVisible();
  });
});
