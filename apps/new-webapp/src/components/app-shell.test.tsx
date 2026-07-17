import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {AppShell} from './app-shell';

const sessionState = vi.hoisted(() => ({
  value: {data: {user: {id: 'u1', name: 'Alex Morgan', email: 'alex@example.com'}}, isPending: false, error: null},
}));
const signOut = vi.hoisted(() => vi.fn());
vi.mock('@/authClient', () => ({authClient: {useSession: () => sessionState.value, signOut}}));
vi.mock('@/lib/finance-provider', () => ({
  FinanceProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useFinance: () => ({data: {categories: [], paymentMethods: [], transactions: [], recurring: [], budgets: []}}),
}));
vi.mock('@/components/feedback-provider', () => ({
  useFeedback: () => ({showToast: vi.fn(), dismissToast: vi.fn()}),
}));
vi.mock('@/theme/theme-provider', () => ({
  ThemeToggle: () => <button aria-label="Use dark theme">Theme</button>,
}));

describe('AppShell', () => {
  it('renders authenticated navigation and route content', () => {
    render(
      <AppShell>
        <h1>Route content</h1>
      </AppShell>,
    );
    expect(screen.getByRole('heading', {name: 'Route content'})).toBeVisible();
    expect(screen.getByRole('navigation', {name: 'Primary navigation'})).toHaveTextContent('Transactions');
    expect(screen.getByText('alex@example.com')).toBeVisible();
  });
  it('removes notifications and exposes a rounded-rectangle avatar menu', async () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.queryByRole('button', {name: /notification/i})).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', {name: 'Open user menu'});
    expect(trigger).toHaveClass('topbar-avatar');
    await userEvent.click(trigger);
    expect(within(screen.getByRole('menu')).getByText('Profile settings')).toBeVisible();
  });

  it('uses the same guarded sign-out workflow from the sidebar and user menu', async () => {
    signOut.mockResolvedValue({data: {}, error: null});
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    await userEvent.click(screen.getByRole('button', {name: 'Sign out'}));
    expect(signOut).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', {name: 'Open user menu'}));
    await userEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', {name: 'Sign out'}));
    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it('moves focus into the mobile navigation and restores it on Escape', async () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    const open = screen.getByRole('button', {name: 'Open navigation'});
    await userEvent.click(open);
    const close = document.querySelector('.mobile-close');
    const workspace = document.querySelector('.workspace');
    await waitFor(() => expect(close).toHaveFocus());
    expect(workspace).toHaveAttribute('aria-hidden', 'true');
    expect(workspace).toHaveAttribute('inert');

    fireEvent.keyDown(close!, {key: 'Escape'});
    await waitFor(() => expect(open).toHaveFocus());
    expect(workspace).not.toHaveAttribute('aria-hidden');
    expect(workspace).not.toHaveAttribute('inert');
  });

  it('opens the command centre from keyboard and search trigger', async () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    fireEvent.keyDown(window, {key: 'k', ctrlKey: true});
    expect(await screen.findByRole('dialog', {name: 'Command centre'})).toBeVisible();
    await userEvent.click(screen.getByRole('button', {name: 'Close dialog'}));
    await userEvent.click(screen.getByRole('button', {name: /search or run a command/i}));
    expect(screen.getByRole('combobox', {name: 'Search commands'})).toBeVisible();
  });
});
