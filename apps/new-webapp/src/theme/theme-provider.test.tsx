import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {ThemeProvider, useTheme} from './theme-provider';

function Consumer() {
  const {mode, setMode} = useTheme();
  return <button onClick={() => setMode('dark')}>{mode}</button>;
}

describe('ThemeProvider', () => {
  it('provides mode state, persists changes, and updates the document', async () => {
    window.localStorage.clear();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    const button = await screen.findByRole('button', {name: 'system'});
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('button', {name: 'dark'})).toBeInTheDocument());
    expect(window.localStorage.getItem('budgetbuddy-theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('rejects use outside the provider', () => {
    expect(() => render(<Consumer />)).toThrow('useTheme must be used within ThemeProvider');
  });
});
