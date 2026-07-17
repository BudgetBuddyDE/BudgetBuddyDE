import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ThemeProvider} from '@/theme/theme-provider';
import {AppShell} from './app-shell';

const mocks = vi.hoisted(() => ({push: vi.fn(), refresh: vi.fn(), signOut: vi.fn()}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/transactions',
  useRouter: () => ({push: mocks.push, refresh: mocks.refresh}),
}));
vi.mock('@/authClient', () => ({authClient: {signOut: mocks.signOut}}));

function renderShell() {
  return render(
    <ThemeProvider>
      <AppShell userName="Ada Lovelace">
        <h1>Transactions</h1>
      </AppShell>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows every release area and marks the current route', () => {
    renderShell();
    const current = screen.getByRole('link', {name: 'Transactions'});
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', {name: 'Reports'})).toHaveAttribute('href', '/reports');
    expect(screen.getByRole('heading', {name: 'Transactions'})).toBeInTheDocument();
  });

  it('opens and closes accessible mobile navigation', async () => {
    renderShell();
    fireEvent.click(screen.getByRole('button', {name: 'Open navigation'}));
    expect(await screen.findByRole('dialog', {name: 'BudgetBuddy'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Close navigation'}));
    await waitFor(() => expect(screen.queryByRole('dialog', {name: 'BudgetBuddy'})).not.toBeInTheDocument());
  });

  it('opens the command palette by button and Ctrl K', async () => {
    renderShell();
    fireEvent.keyDown(window, {key: 'k', ctrlKey: true});
    expect(await screen.findByRole('dialog', {name: 'Command palette'})).toBeInTheDocument();
  });

  it('routes to sign in after a successful sign out and reports failures', async () => {
    mocks.signOut.mockResolvedValueOnce({error: null});
    renderShell();
    fireEvent.click(screen.getByRole('button', {name: 'Sign out'}));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/sign-in'));

    mocks.signOut.mockResolvedValueOnce({error: {message: 'failed'}});
    fireEvent.click(screen.getByRole('button', {name: 'Sign out'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign out failed');
  });
});
