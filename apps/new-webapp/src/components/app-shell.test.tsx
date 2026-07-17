import {fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {AppShell} from './app-shell';

const sessionState = vi.hoisted(() => ({
  value: {data: {user: {id: 'u1', name: 'Alex Morgan', email: 'alex@example.com'}}, isPending: false, error: null},
  signOut: vi.fn(),
}));
vi.mock('@/authClient', () => ({authClient: {useSession: () => sessionState.value, signOut: sessionState.signOut}}));
vi.mock('@/lib/finance-provider', () => ({
  FinanceProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  useFinance: () => ({
    data: {categories: [], paymentMethods: [], transactions: [], recurring: [], budgets: []},
    notice: null,
    clearNotice: vi.fn(),
  }),
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

  it('opens account actions from both avatar hover targets and signs out', async () => {
    const user = userEvent.setup();
    sessionState.signOut.mockResolvedValue(undefined);
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );

    const sidebarTrigger = screen.getByRole('button', {name: 'Open sidebar account menu'});
    await user.hover(sidebarTrigger);
    const sidebarMenu = screen.getByRole('menu', {name: 'Sidebar account'});
    expect(sidebarMenu).toBeVisible();
    expect(within(sidebarMenu).getByRole('menuitem', {name: 'Settings'})).toHaveAttribute('href', '/settings/profile');
    await user.unhover(sidebarTrigger);

    const topbarTrigger = screen.getByRole('button', {name: 'Open account menu'});
    await user.hover(topbarTrigger);
    const topbarMenu = screen.getByRole('menu', {name: 'Account'});
    await user.click(within(topbarMenu).getByRole('menuitem', {name: 'Sign out'}));
    expect(sessionState.signOut).toHaveBeenCalledOnce();
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
