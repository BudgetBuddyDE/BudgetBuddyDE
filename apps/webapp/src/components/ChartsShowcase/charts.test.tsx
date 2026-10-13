import {BulletChart, ChartLegend, ChartTooltip, HeatmapChart, ParentSize} from '@budgetbuddyde/charts';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ChartsShowcase} from './ChartsShowcase';
import {ChartCard} from './ShowcaseLayout';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('chart presentation', () => {
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
