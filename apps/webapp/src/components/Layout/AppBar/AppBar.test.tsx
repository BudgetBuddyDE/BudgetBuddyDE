import {fireEvent, render, screen, within} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {AppBar} from './AppBar';
import {DrawerProvider} from '../Drawer/DrawerContext';

const renderAppBar = (props: React.ComponentProps<typeof AppBar> = {}) =>
  render(
    <DrawerProvider>
      <AppBar {...props} />
    </DrawerProvider>,
  );

describe('AppBar', () => {
  it('renders the navigation toggle in the app bar and toggles the drawer', () => {
    renderAppBar();

    const appBar = within(screen.getByRole('banner'));
    const toggle = appBar.getByRole('button', {name: 'Toggle navigation'});

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides the brand by default', () => {
    renderAppBar();

    expect(screen.queryByRole('link', {name: 'BudgetBuddyDE'})).not.toBeInTheDocument();
  });

  it('renders the brand when explicitly enabled', () => {
    renderAppBar({showBrand: true});

    expect(screen.getByRole('link', {name: 'BudgetBuddyDE'})).toHaveAttribute('href', '/');
  });
});
