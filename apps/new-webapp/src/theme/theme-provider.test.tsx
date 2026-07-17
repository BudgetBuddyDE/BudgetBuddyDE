import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ThemeProvider, ThemeToggle} from './theme-provider';

describe('ThemeProvider', () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.restoreAllMocks();
  });

  it('uses and persists the saved theme', async () => {
    window.localStorage.setItem('budgetbuddy-theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    expect(screen.getByRole('button', {name: 'Use light theme'})).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', {name: 'Use light theme'}));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('budgetbuddy-theme')).toBe('light');
  });

  it('falls back to the system preference', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({matches: true} as MediaQueryList);
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
  });
});
