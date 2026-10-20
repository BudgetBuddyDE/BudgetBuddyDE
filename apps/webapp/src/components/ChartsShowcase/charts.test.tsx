import {
  BulletChart,
  ChartLegend,
  ChartTooltip,
  DonutChart,
  FunnelChart,
  HeatmapChart,
  ParentSize,
  RadialBarChart,
  WaterfallChart,
} from '@budgetbuddyde/charts';
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import {ChartsShowcase} from './ChartsShowcase';
import {ChartCard} from './ShowcaseLayout';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('chart presentation', () => {
  it('renders donut sectors with explicit and identity-based colors without mutating the data', () => {
    const data = [
      {id: 'food', label: 'Food', value: 50},
      {id: 'rent', label: 'Rent', value: 100, color: '#123456'},
    ];
    const {container, rerender} = render(<DonutChart width={300} data={data} primaryText="Total" />);
    const sectors = container.querySelectorAll('.recharts-sector');
    expect(sectors).toHaveLength(2);
    expect(sectors[0]).toHaveAttribute('fill', '#123456');
    const foodColor = sectors[1].getAttribute('fill');
    expect(foodColor).toMatch(/^var\(--bb-chart-series-/);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(data.every(entry => !('fill' in entry))).toBe(true);

    rerender(<DonutChart width={300} data={[...data].reverse()} />);
    expect(container.querySelectorAll('.recharts-sector')[0]).toHaveAttribute('fill', '#123456');
    expect(container.querySelectorAll('.recharts-sector')[1]).toHaveAttribute('fill', foodColor);
    expect(data.map(entry => entry.id)).toEqual(['food', 'rent']);
  });

  it.each([{values: [0, 50, 100, 50]}, {values: [0, 50, -100, -50]}])(
    'sorts the donut legend by absolute value for $values without changing the data',
    ({values}) => {
      const data = values.map((value, index) => ({label: `Entry ${index}`, value}));
      render(<DonutChart width={300} data={data} showLegend />);

      const items = within(screen.getByRole('list', {name: 'Chart legend'})).getAllByRole('listitem');
      expect(items.map(item => within(item).getByText(/^Entry /).textContent)).toEqual([
        'Entry 2',
        'Entry 1',
        'Entry 3',
        'Entry 0',
      ]);
      expect(data.map(entry => entry.value)).toEqual(values);
      expect(data.every(entry => !('fill' in entry))).toBe(true);
    },
  );

  it('renders funnel trapezoids with explicit and identity-based colors without mutating the data', () => {
    const data = [
      {name: 'Planned', value: 100, fill: '#123456'},
      {name: 'Spent', value: 50},
    ];
    const {container, rerender} = render(<FunnelChart width={300} data={data} />);
    const trapezoids = container.querySelectorAll('.recharts-trapezoid');
    expect(trapezoids).toHaveLength(2);
    expect(trapezoids[0]).toHaveAttribute('fill', '#123456');
    const spentColor = trapezoids[1].getAttribute('fill');
    expect(spentColor).toMatch(/^var\(--bb-chart-series-/);
    expect(data.every(entry => !('fill' in entry) || entry.fill === '#123456')).toBe(true);

    rerender(<FunnelChart width={300} data={[...data].reverse()} />);
    expect(container.querySelectorAll('.recharts-trapezoid')[0]).toHaveAttribute('fill', spentColor);
  });

  it('renders radial bar sectors with explicit and identity-based colors without mutating the data', () => {
    const data = [
      {label: 'Income', value: 100, fill: '#123456'},
      {label: 'Expenses', value: 50},
    ];
    const {container, rerender} = render(<RadialBarChart width={300} data={data} />);
    const sectors = Array.from(container.querySelectorAll('.recharts-sector'));
    const incomeSector = sectors.find(sector => sector.getAttribute('fill') === '#123456');
    const expensesSector = sectors.find(sector => sector.getAttribute('fill')?.startsWith('var(--bb-chart-series-'));
    expect(incomeSector).toBeDefined();
    expect(expensesSector).toBeDefined();
    const expensesColor = expensesSector?.getAttribute('fill');
    expect(expensesColor).toMatch(/^var\(--bb-chart-series-/);
    expect(data.every(entry => !('name' in entry))).toBe(true);

    rerender(<RadialBarChart width={300} data={[...data].reverse()} />);
    expect(
      Array.from(container.querySelectorAll('.recharts-sector')).find(
        sector => sector.getAttribute('fill') === expensesColor,
      ),
    ).toBeDefined();
  });

  it('renders waterfall bars with colors based on increase, decrease, and total rows', () => {
    const data = [
      {label: 'Increase', value: 100},
      {label: 'Decrease', value: -40},
      {label: 'Balance', value: 60, isTotal: true},
    ];
    const {container} = render(<WaterfallChart width={300} data={data} />);
    const bars = Array.from(container.querySelectorAll('.recharts-rectangle'));
    expect(bars).toHaveLength(3);
    expect(bars.map(bar => bar.getAttribute('fill'))).toEqual([
      'var(--bb-chart-income, #0F766E)',
      'var(--bb-chart-expense, #C2410C)',
      'var(--bb-chart-balance, #2563EB)',
    ]);
  });

  it('exposes series visibility as accessible toggle buttons', () => {
    const toggle = vi.fn();
    render(
      <ChartLegend
        items={[{key: 'income', label: 'Income', color: '#0F766E'}]}
        hiddenKeys={['income']}
        onToggle={toggle}
      />,
    );
    const button = screen.getByRole('button', {name: 'Income'});
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalledWith('income');
  });
  it('renders all showcase sections and hierarchical data without runtime errors', () => {
    render(<ChartsShowcase />);
    expect(screen.getByRole('heading', {name: 'Financial charts'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Spending sunburst'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Spending intensity'})).toBeInTheDocument();
  });
  it('uses exact per-series formats instead of compact axis formats', () => {
    render(
      <ChartTooltip
        active
        label="January"
        valueFormatter={value => `${value} EUR`}
        seriesFormatters={{rate: value => `${value}%`}}
        payload={[
          {name: 'Amount', dataKey: 'amount', value: 1234.56},
          {name: 'Rate', dataKey: 'rate', value: 25},
          {name: 'Missing', value: null},
        ]}
      />,
    );
    expect(screen.getByText('1234.56 EUR')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.queryByText('Missing')).not.toBeInTheDocument();
  });

  it('distinguishes missing heatmap cells from zero and supports arrow navigation', () => {
    render(
      <HeatmapChart
        width={300}
        data={[{x: 'Mon', y: 'W1', value: 0}]}
        xLabels={['Mon', 'Tue']}
        yLabels={['W1']}
        valueFormatter={value => `${value} EUR`}
      />,
    );
    const zero = screen.getByRole('button', {name: 'W1, Mon: 0 EUR'});
    const missing = screen.getByRole('button', {name: 'W1, Tue: No data'});
    zero.focus();
    fireEvent.keyDown(zero, {key: 'ArrowRight'});
    expect(missing).toHaveFocus();
    expect(missing).toHaveAttribute('tabindex', '0');
  });

  it('measures container changes and disconnects its observer', () => {
    let resize = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    let width = 300;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      width,
      height: 100,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 100,
      right: width,
      toJSON: () => ({}),
    }));
    const {unmount} = render(<ParentSize width={400}>{size => <span>{size.width}</span>}</ParentSize>);
    expect(screen.getByText('300')).toBeInTheDocument();
    act(() => {
      width = 200;
      resize();
    });
    expect(screen.getByText('200')).toBeInTheDocument();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('shows budget overruns and offers the underlying data', () => {
    render(
      <ChartCard title="Budget">
        <BulletChart width={300} data={[{label: 'Food', actual: 120, target: 100, max: 110}]} />
      </ChartCard>,
    );
    expect(screen.getByText('Target 100 (exceeded)')).toBeInTheDocument();
    expect(screen.getByText('View data')).toBeInTheDocument();
    expect(screen.getByRole('table', {hidden: true, name: 'Budget data'})).toBeInTheDocument();
  });
});
