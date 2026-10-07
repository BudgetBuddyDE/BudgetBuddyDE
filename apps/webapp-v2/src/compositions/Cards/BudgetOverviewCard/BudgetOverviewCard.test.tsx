import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {createRef} from 'react';
import type {ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {BudgetOverviewCard} from './BudgetOverviewCard';

function TestProvider({children}: {children: ReactNode}) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const screenshotBudget = {totalBudget: 4129.93, spent: 1244.38, futureExpenses: 1678.44};

function getSegmentWidth(label: string) {
  return Number.parseFloat(screen.getByLabelText(label).style.getPropertyValue('--progress-section-size'));
}

function expectLegendAmount(label: string, amount: string) {
  const term = screen.getAllByRole('term').find(element => element.textContent === label);
  expect(term).toBeDefined();
  const row = term?.closest('dl > div');
  expect(row).not.toBeNull();
  expect(within(row as HTMLElement).getByRole('definition')).toHaveTextContent(amount);
}

describe('BudgetOverviewCard', () => {
  it('renders the screenshot amounts with a semantic title, total and legend', () => {
    render(<BudgetOverviewCard {...screenshotBudget} aria-label="Budget overview" />, {wrapper: TestProvider});

    const root = screen.getByRole('region', {name: 'Budget overview'});
    const title = screen.getByRole('heading', {name: 'Budget', level: 2});
    const total = screen.getByText('4.129,93 €');
    expect(root.tagName).toBe('SECTION');
    expect(root).not.toHaveAttribute('data-with-border');
    expect(root.style.getPropertyValue('--card-padding')).toBe('calc(1rem * var(--mantine-scale))');
    expect(root.style.getPropertyValue('--paper-radius')).toBe('calc(1rem * var(--mantine-scale))');
    expect(root.style.getPropertyValue('--paper-shadow')).toBe('var(--mantine-shadow-none)');
    expect(total.tagName).toBe('P');
    expect(title.closest('[data-first-section]')?.parentElement).toBe(root);
    expect(screen.getAllByRole('term')).toHaveLength(3);
    expect(screen.getAllByRole('definition')).toHaveLength(3);
    expect(screen.getByText('Spent').closest('dl')).toBeInTheDocument();
    expectLegendAmount('Spent', '1.244,38 €');
    expectLegendAmount('Upcoming Expenses', '1.678,44 €');
    expectLegendAmount('Available', '1.207,11 €');
    expect(screen.getByRole('img', {name: 'Budget progress'})).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(getSegmentWidth('Spent')).toBeCloseTo((1244.38 / 4129.93) * 100);
    expect(getSegmentWidth('Upcoming Expenses')).toBeCloseTo((1678.44 / 4129.93) * 100);
    expect(getSegmentWidth('Available')).toBeCloseTo((1207.11 / 4129.93) * 100);
    for (const term of screen.getAllByRole('term')) {
      const dot = term.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
      expect((dot as HTMLElement).style.background).toBe(
        screen.getByLabelText(term.textContent as string).style.getPropertyValue('--progress-section-color'),
      );
    }
  });

  it('uses each budget amount as its corresponding share of the total', () => {
    render(<BudgetOverviewCard totalBudget={100} spent={25} futureExpenses={35} />, {wrapper: TestProvider});

    expect(getSegmentWidth('Spent')).toBe(25);
    expect(getSegmentWidth('Upcoming Expenses')).toBe(35);
    expect(getSegmentWidth('Available')).toBe(40);
    expectLegendAmount('Available', '40,00 €');
  });

  it('caps planned expenses at the remaining bar space and displays a positive shortfall', () => {
    render(<BudgetOverviewCard totalBudget={100} spent={80} futureExpenses={40} />, {wrapper: TestProvider});

    expect(getSegmentWidth('Spent')).toBe(80);
    expect(getSegmentWidth('Upcoming Expenses')).toBe(20);
    expect(getSegmentWidth('Overdrawn')).toBe(0);
    expectLegendAmount('Upcoming Expenses', '40,00 €');
    expectLegendAmount('Overdrawn', '20,00 €');
    expect(screen.queryByText('Available')).not.toBeInTheDocument();
    const overdrawn = screen.getAllByRole('definition')[2];
    expect(overdrawn.style.color).toBe('var(--mantine-color-red-text)');
    expect(screen.getByLabelText('Overdrawn').style.getPropertyValue('--progress-section-color')).toBe(
      screen.getByLabelText('Spent').style.getPropertyValue('--progress-section-color'),
    );
  });

  it.each([
    {spent: 100, futureExpenses: 0, label: 'Available', amount: '0,00 €'},
    {spent: 125, futureExpenses: 10, label: 'Overdrawn', amount: '35,00 €'},
  ])('caps spending when the budget is fully spent or exceeded: $spent', ({spent, futureExpenses, label, amount}) => {
    render(<BudgetOverviewCard totalBudget={100} spent={spent} futureExpenses={futureExpenses} />, {
      wrapper: TestProvider,
    });

    expect(getSegmentWidth('Spent')).toBe(100);
    expect(getSegmentWidth('Upcoming Expenses')).toBe(0);
    expect(getSegmentWidth(label)).toBe(0);
    expectLegendAmount(label, amount);
  });

  it.each([
    {totalBudget: 0, spent: 0, futureExpenses: 0, label: 'Available', amount: '0,00 €'},
    {totalBudget: 0, spent: 10, futureExpenses: 20, label: 'Overdrawn', amount: '30,00 €'},
    {totalBudget: -100, spent: 10, futureExpenses: 20, label: 'Overdrawn', amount: '130,00 €'},
  ])('leaves all segments empty for a nonpositive total: $totalBudget / $spent', budget => {
    render(
      <BudgetOverviewCard
        totalBudget={budget.totalBudget}
        spent={budget.spent}
        futureExpenses={budget.futureExpenses}
      />,
      {wrapper: TestProvider},
    );

    expect(getSegmentWidth('Spent')).toBe(0);
    expect(getSegmentWidth('Upcoming Expenses')).toBe(0);
    expect(getSegmentWidth(budget.label)).toBe(0);
    expectLegendAmount(budget.label, budget.amount);
  });

  it('updates amounts, labels and bar shares when the props change', () => {
    const {rerender} = render(<BudgetOverviewCard totalBudget={100} spent={80} futureExpenses={40} />, {
      wrapper: TestProvider,
    });

    expectLegendAmount('Overdrawn', '20,00 €');
    rerender(<BudgetOverviewCard totalBudget={200} spent={50} futureExpenses={50} />);

    expect(screen.getByText('200,00 €')).toBeInTheDocument();
    expectLegendAmount('Available', '100,00 €');
    expect(screen.queryByText('Overdrawn')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Overdrawn')).not.toBeInTheDocument();
    expect(getSegmentWidth('Spent')).toBe(25);
    expect(getSegmentWidth('Upcoming Expenses')).toBe(25);
    expect(getSegmentWidth('Available')).toBe(50);
  });

  it.each([
    {label: 'Spent', amount: '1.244,38 €'},
    {label: 'Upcoming Expenses', amount: '1.678,44 €'},
    {label: 'Available', amount: '1.207,11 €'},
  ])('shows the formatted $label amount in its segment tooltip', async ({label, amount}) => {
    render(<BudgetOverviewCard {...screenshotBudget} />, {wrapper: TestProvider});

    fireEvent.mouseEnter(screen.getByLabelText(label));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(`${label} · ${amount}`);
  });

  it('shows the shortfall in the overdrawn segment tooltip', async () => {
    render(<BudgetOverviewCard totalBudget={100} spent={80} futureExpenses={40} />, {wrapper: TestProvider});

    fireEvent.mouseEnter(screen.getByLabelText('Overdrawn'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Overdrawn · 20,00 €');
  });

  it('forwards HTML attributes, click events and ref to the card root', () => {
    const ref = createRef<HTMLElement>();
    const onClick = vi.fn();
    render(
      <BudgetOverviewCard
        {...screenshotBudget}
        ref={ref}
        id="budget-overview"
        aria-label="Budget overview"
        tabIndex={0}
        onClick={onClick}
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('region', {name: 'Budget overview'});
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'budget-overview');
    expect(root).toHaveAttribute('tabindex', '0');
    fireEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts Mantine Card props and caller styles', () => {
    render(
      <BudgetOverviewCard
        {...screenshotBudget}
        aria-label="Custom budget"
        padding="xl"
        radius="xl"
        shadow="sm"
        withBorder
        className="custom-card"
        classNames={{root: 'custom-root', section: 'custom-section'}}
        style={{backgroundColor: 'pink'}}
        styles={{root: {fontStyle: 'italic'}}}
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('region', {name: 'Custom budget'});
    expect(root).toHaveClass('custom-card', 'custom-root');
    expect(root).toHaveAttribute('data-with-border');
    expect(root.style.getPropertyValue('--card-padding')).toBe('var(--mantine-spacing-xl)');
    expect(root.style.getPropertyValue('--paper-radius')).toBe('var(--mantine-radius-xl)');
    expect(root.style.getPropertyValue('--paper-shadow')).toBe('var(--mantine-shadow-sm)');
    expect(root.style.backgroundColor).toBe('pink');
    expect(root.style.fontStyle).toBe('italic');
    expect(screen.getByRole('heading', {name: 'Budget'}).closest('[data-first-section]')).toHaveClass('custom-section');
  });

  it('supports an anchor root with native props and matching ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <BudgetOverviewCard
        {...screenshotBudget}
        component="a"
        href="/dashboard/budgets"
        ref={ref}
        aria-label="View budgets"
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('link', {name: 'View budgets'});
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('href', '/dashboard/budgets');
    expectLegendAmount('Available', '1.207,11 €');
  });

  it('passes its content, root props and ref through a custom root renderer', () => {
    const ref = createRef<HTMLElement>();
    render(
      <BudgetOverviewCard
        {...screenshotBudget}
        ref={ref}
        aria-label="Custom renderer"
        renderRoot={props => <section {...props} data-custom-root="true" />}
      />,
      {wrapper: TestProvider},
    );

    const root = screen.getByRole('region', {name: 'Custom renderer'});
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('data-custom-root', 'true');
    expect(screen.getByRole('heading', {name: 'Budget', level: 2})).toBeInTheDocument();
    expectLegendAmount('Available', '1.207,11 €');
  });
});
