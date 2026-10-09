import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import type {ReactNode} from 'react';
import {createRef} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {EntityList} from './EntityList';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

describe('EntityList', () => {
  it('renders an optional footer alongside the empty state', () => {
    render(<EntityList title="Budgets" data={[]} renderItem={() => null} footer={<button>Next page</button>} />, {
      wrapper: TestProvider,
    });
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next page'})).toBeInTheDocument();
  });

  it('renders the typed item renderer, title, subtitle and card props', () => {
    render(
      <EntityList
        title="Transactions"
        subtitle="Your latest transactions"
        data={[{id: 'one', name: 'OpenAI'}]}
        renderItem={item => <span>{item.name}</span>}
        aria-label="Latest transactions"
        withBorder
      />,
      {wrapper: TestProvider},
    );

    expect(screen.getByRole('region', {name: 'Latest transactions'})).toHaveAttribute('data-with-border');
    expect(screen.getByRole('heading', {name: 'Transactions', level: 2})).toBeInTheDocument();
    expect(screen.getByText('Your latest transactions')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Add Transactions'})).not.toBeInTheDocument();
  });

  it('shows an accessible add action only when a callback exists and lets headerAction override it', () => {
    const onAddEntity = vi.fn();
    const {rerender} = render(
      <EntityList title="Budgets" data={[]} renderItem={() => null} onAddEntity={onAddEntity} />,
      {wrapper: TestProvider},
    );

    fireEvent.click(screen.getByRole('button', {name: 'Add Budgets'}));
    expect(onAddEntity).toHaveBeenCalledOnce();

    rerender(
      <EntityList
        title="Budgets"
        data={[]}
        renderItem={() => null}
        onAddEntity={onAddEntity}
        headerAction={<button type="button">Custom action</button>}
      />,
    );
    expect(screen.getByRole('button', {name: 'Custom action'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Add Budgets'})).not.toBeInTheDocument();
  });

  it('renders loading and empty states', () => {
    const {rerender} = render(<EntityList title="Payments" data={[]} renderItem={() => null} isLoading />, {
      wrapper: TestProvider,
    });
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();

    rerender(<EntityList title="Payments" data={[]} renderItem={() => null} noResultsMessage="Nothing upcoming" />);
    expect(screen.getByText('Nothing upcoming')).toBeInTheDocument();
  });

  it('supports a polymorphic root and forwards its ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <EntityList
        component="a"
        href="/transactions"
        ref={ref}
        title="Transactions"
        data={[]}
        renderItem={() => null}
      />,
      {wrapper: TestProvider},
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/transactions');
    expect(ref.current).toBe(link);
  });
});
