import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {ThemeProvider} from '@/theme/theme-provider';
import {ThemeToggle} from './theme-toggle';

describe('ThemeToggle', () => {
  it('switches theme through its accessible action', () => {
    window.localStorage.clear();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const toggle = screen.getByRole('button', {name: 'Use dark theme'});
    fireEvent.click(toggle);
    expect(screen.getByRole('button', {name: 'Use light theme'})).toBeInTheDocument();
  });
});
