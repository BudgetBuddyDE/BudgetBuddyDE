import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen} from '@testing-library/react';
import {createRef} from 'react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {StatsCard} from './StatsCard';
import classes from './StatsCard.module.css';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const stats = {title: 'Monthly spending', value: '560 €', subtitle: 'Across three budgets'};

describe('StatsCard', () => {
  it('composes a semantic title, value and subtitle with neutral card defaults', () => {
    render(<StatsCard {...stats} aria-label="Spending summary" />, {wrapper: TestProvider});

    const root = screen.getByRole('region', {name: 'Spending summary'});
    const title = screen.getByRole('heading', {name: stats.title, level: 2});
    const value = screen.getByText(stats.value);
    const subtitle = screen.getByText(stats.subtitle);

    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveAttribute('data-with-border');
    expect(root.style.getPropertyValue('--card-padding')).toBe('var(--mantine-spacing-md)');
    expect(root.style.getPropertyValue('--paper-radius')).toBe('var(--mantine-radius-md)');
    expect(root.style.getPropertyValue('--paper-shadow')).toBe('');
    expect(title.parentElement).toHaveAttribute('data-first-section');
    expect(subtitle.parentElement).toHaveAttribute('data-last-section');
    for (const section of [title.parentElement, value.parentElement, subtitle.parentElement]) {
      expect(section?.parentElement).toBe(root);
      expect(section).not.toHaveAttribute('data-with-border');
    }
  });

  it('accepts arbitrary ReactNodes for all content fields', () => {
    render(
      <StatsCard
        title={<span>Account balance</span>}
        value={<strong>1.200 €</strong>}
        subtitle={
          <>
            Updated <span>today</span>
          </>
        }
      />,
      {wrapper: TestProvider},
    );

    expect(screen.getByRole('heading', {name: 'Account balance', level: 2})).toBeInTheDocument();
    expect(screen.getByText('1.200 €').tagName).toBe('STRONG');
    expect(screen.getByText('today')).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toHaveTextContent('Updated today');
  });

  it('renders an optional decorative icon inside the body', () => {
    const {rerender} = render(
      <StatsCard {...stats} icon={<svg role="img" aria-label="Spending icon" data-testid="stats-icon" />} />,
      {wrapper: TestProvider},
    );

    const icon = screen.getByTestId('stats-icon');
    const iconContainer = icon.closest('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.parentElement).toBe(screen.getByText(stats.value).parentElement);
    expect(screen.queryByRole('img', {name: 'Spending icon'})).not.toBeInTheDocument();

    rerender(<StatsCard {...stats} />);
    expect(screen.queryByTestId('stats-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', {name: stats.title, level: 2})).toBeInTheDocument();
    expect(screen.getByText(stats.value)).toBeInTheDocument();
  });

  it('forwards HTML attributes, events and a ref to the root', () => {
    const ref = createRef<HTMLElement>();
    const onClick = vi.fn();
    render(
      <StatsCard
        {...stats}
        ref={ref}
        id="spending-card"
        aria-label="Spending summary"
        tabIndex={0}
        onClick={onClick}
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('region', {name: 'Spending summary'});
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'spending-card');
    expect(root).toHaveAttribute('tabindex', '0');
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('allows card defaults and styling to be overridden while retaining its own root class', () => {
    render(
      <StatsCard
        {...stats}
        aria-label="Custom summary"
        padding="xl"
        radius="xl"
        shadow="sm"
        withBorder={false}
        c="red"
        className="custom-card"
        classNames={{root: 'custom-root', section: 'custom-section'}}
        style={{backgroundColor: 'pink'}}
        styles={{root: {fontStyle: 'italic'}, section: {color: 'blue'}}}
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('region', {name: 'Custom summary'});
    expect(root).toHaveClass(classes.root, 'custom-card', 'custom-root');
    expect(root).not.toHaveAttribute('data-with-border');
    expect(root.style.getPropertyValue('--card-padding')).toBe('var(--mantine-spacing-xl)');
    expect(root.style.getPropertyValue('--paper-radius')).toBe('var(--mantine-radius-xl)');
    expect(root.style.getPropertyValue('--paper-shadow')).toBe('var(--mantine-shadow-sm)');
    expect(root.style.backgroundColor).toBe('pink');
    expect(root.style.fontStyle).toBe('italic');
    expect(root.style.color).toBe('var(--mantine-color-red-text)');
    for (const section of [
      screen.getByRole('heading', {name: stats.title}).parentElement,
      screen.getByText(stats.value).parentElement,
      screen.getByText(stats.subtitle).parentElement,
    ]) {
      expect(section).toHaveClass('custom-section');
      expect(section).toHaveStyle({color: 'blue'});
    }
  });

  it('supports a polymorphic anchor root with matching native props and ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<StatsCard {...stats} component="a" href="/dashboard/budgets" ref={ref} aria-label="View budgets" />, {
      wrapper: TestProvider,
    });

    const root = screen.getByRole('link', {name: 'View budgets'});
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('href', '/dashboard/budgets');
    expect(screen.getByRole('heading', {name: stats.title, level: 2})).toBeInTheDocument();
  });

  it('forwards content, root props and ref through renderRoot', () => {
    const ref = createRef<HTMLElement>();
    render(
      <StatsCard
        {...stats}
        ref={ref}
        aria-label="Custom renderer"
        renderRoot={props => <section {...props} data-custom-root="true" />}
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('region', {name: 'Custom renderer'});
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('data-custom-root', 'true');
    expect(root).toHaveAttribute('data-with-border');
    expect(screen.getByRole('heading', {name: stats.title, level: 2})).toBeInTheDocument();
    expect(screen.getByText(stats.value)).toBeInTheDocument();
    expect(screen.getByText(stats.subtitle)).toBeInTheDocument();
  });
});
