import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {buildReport} from './InsightsReport.fixtures';

const {composedChartProps, barChartProps, lineChartProps, waterfallChartProps, getReport} = vi.hoisted(() => ({
  composedChartProps: vi.fn(),
  barChartProps: vi.fn(),
  lineChartProps: vi.fn(),
  waterfallChartProps: vi.fn(),
  getReport: vi.fn(),
}));

vi.mock('@/apiClient', () => ({apiClient: {backend: {insights: {getReport}}}}));

vi.mock('@budgetbuddyde/charts', () => ({
  BarChart: (props: unknown) => {
    barChartProps(props);
    return <div data-testid="bar-chart" />;
  },
  LineChart: (props: unknown) => {
    lineChartProps(props);
    return <div data-testid="line-chart" />;
  },
  WaterfallChart: (props: unknown) => {
    waterfallChartProps(props);
    return <div data-testid="waterfall-chart" />;
  },
  HeatmapChart: ({
    data,
    onSelect,
  }: {
    data: {x: string; y: string; value: number | null}[];
    onSelect: (point: unknown) => void;
  }) => <button onClick={() => onSelect(data.find(point => point.value !== null))}>Select daily cell</button>,
  ComposedChart: (props: unknown) => {
    composedChartProps(props);
    return <div data-testid="composed-chart" />;
  },
}));

import {InsightsReportCharts} from './InsightsReportCharts';

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('InsightsReportCharts reference lines', () => {
  it('shows average period income and expenses, with cumulative balance on a separate axis', () => {
    const report = buildReport({
      timeline: [
        {...buildReport().timeline[0], label: 'Period 1', income: 100, expenses: 40},
        {...buildReport().timeline[0], label: 'Period 2', income: 300, expenses: 60},
      ],
    });

    render(<InsightsReportCharts report={report} />);

    const [cashflowChart] = composedChartProps.mock.calls.map(([props]) => props);
    expect(cashflowChart.referenceLines).toEqual([
      {y: 50, label: 'Avg. expenses', role: 'expense', yAxisId: 'left'},
      {y: 200, label: 'Avg. income', role: 'income', yAxisId: 'left'},
    ]);
    expect(cashflowChart.leftAxisLabel).toBe('Period amount');
    expect(cashflowChart.rightAxisLabel).toBe('Cumulative balance');
    expect(cashflowChart.series.find((series: {key: string}) => series.key === 'cumulativeBalance').yAxisId).toBe(
      'right',
    );
  });

  it('averages category totals per period, not all category points together', () => {
    const report = buildReport({
      timeline: [
        {...buildReport().timeline[0], label: 'Period 1'},
        {...buildReport().timeline[0], label: 'Period 2'},
      ],
      categoryTimeline: [
        {categoryId: 'category-a' as never, label: 'A', values: [10, 90]},
        {categoryId: 'category-b' as never, label: 'B', values: [90, 10]},
      ],
    });

    render(<InsightsReportCharts report={report} />);

    const [, categoryChart] = composedChartProps.mock.calls.map(([props]) => props);
    expect(categoryChart.referenceLines).toEqual([
      {y: 100, label: 'Avg. total expenses', role: 'target', yAxisId: 'left'},
    ]);
    expect(categoryChart.data).toEqual([
      {label: 'Period 1', 'category-0': 10, 'category-1': 90},
      {label: 'Period 2', 'category-0': 90, 'category-1': 10},
    ]);
  });

  it('omits reference lines when there are no periods', () => {
    const report = buildReport({timeline: [], categoryTimeline: []});
    render(<InsightsReportCharts report={report} />);
    expect(composedChartProps.mock.calls.map(([props]) => props.referenceLines)).toEqual([[], []]);
  });
});

const daily = () =>
  buildReport({
    timezone: 'Europe/Berlin',
    granularity: 'day',
    period: {from: new Date('2026-12-29T23:00:00Z'), to: new Date('2026-12-31T22:59:59Z')},
    timeline: [
      {...buildReport().timeline[0], from: new Date('2026-12-29T23:00:00Z'), label: 'Dec 30', expenses: 40},
      {...buildReport().timeline[0], from: new Date('2026-12-30T23:00:00Z'), label: 'Dec 31', expenses: 0},
    ],
  });

describe('Insights chart modes', () => {
  it('keeps the timeline as default and explains income minus expenses on demand', () => {
    render(<InsightsReportCharts report={buildReport()} />);
    expect(getReport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Composition'}));
    expect(screen.getByText('Cash flow composition')).toBeInTheDocument();
    expect(waterfallChartProps.mock.lastCall?.[0].data.at(-1)).toMatchObject({
      label: 'Net cash flow',
      value: 900,
      isTotal: true,
    });
    expect(waterfallChartProps.mock.lastCall?.[0].valueFormatter(0.01)).toContain('0,01');
    expect(getReport).not.toHaveBeenCalled();
  });

  it('shows savings rate gaps without connecting zero-income periods', () => {
    const report = buildReport({timeline: [{...buildReport().timeline[0], income: 0, balance: -50}]});
    render(<InsightsReportCharts report={report} />);
    fireEvent.click(screen.getByRole('button', {name: 'Savings rate'}));
    expect(lineChartProps.mock.lastCall?.[0]).toMatchObject({
      data: [{label: 'Jan 2026', savingsRate: null}],
      connectNulls: false,
    });
    expect(screen.getByText(/N\/A \(no recorded income\)/)).toBeInTheDocument();
  });

  it('switches cumulative categories to actual period amounts', () => {
    const report = buildReport({
      timeline: [buildReport().timeline[0], {...buildReport().timeline[0], label: 'B'}],
      categoryTimeline: [{categoryId: null, label: 'Other', values: [20, 30]}],
    });
    render(<InsightsReportCharts report={report} />);
    fireEvent.click(screen.getByRole('button', {name: 'Per period'}));
    expect(barChartProps.mock.lastCall?.[0]).toMatchObject({
      stacked: true,
      data: [
        {label: 'Jan 2026', 'category-0': 20},
        {label: 'B', 'category-0': 10},
      ],
    });
    expect(barChartProps.mock.lastCall?.[0].series[0].colorId).toBe('other-categories');
  });

  it('loads the daily report lazily, retains filters in selection links and reuses the result after mode switches', async () => {
    const report = buildReport();
    const query = {$categories: ['cat-1'], $paymentMethods: ['pm-2']};
    getReport.mockResolvedValue([{data: daily()}, null]);
    render(<InsightsReportCharts report={report} reportQuery={query} />);
    expect(getReport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Daily patterns'}));
    await screen.findByRole('button', {name: 'Select daily cell'});
    expect(getReport.mock.lastCall?.[0]).toMatchObject({
      $categories: ['cat-1'],
      $paymentMethods: ['pm-2'],
      $granularity: 'day',
      $comparison: 'none',
    });
    fireEvent.click(screen.getByRole('button', {name: 'Select daily cell'}));
    const link = screen.getByRole('link', {name: 'View transactions on 2026-12-30'});
    const params = new URL(link.getAttribute('href')!, 'http://localhost').searchParams;
    expect(params.get('cat')).toBe('cat-1');
    expect(params.get('pm')).toBe('pm-2');
    expect(params.get('dateFrom')).toBe('2026-12-30');
    expect(params.get('dateTo')).toBe('2026-12-30');
    fireEvent.click(screen.getByRole('button', {name: 'Composition'}));
    fireEvent.click(screen.getByRole('button', {name: 'Daily patterns'}));
    await waitFor(() => expect(getReport).toHaveBeenCalledTimes(1));
  });

  it('uses a daily main report without a duplicate request', () => {
    render(<InsightsReportCharts report={daily()} />);
    fireEvent.click(screen.getByRole('button', {name: 'Daily patterns'}));
    expect(screen.getByRole('button', {name: 'Select daily cell'})).toBeInTheDocument();
    expect(getReport).not.toHaveBeenCalled();
  });

  it('reports daily request errors and retries without exposing partial data', async () => {
    getReport.mockResolvedValueOnce([null, new Error('Daily failed')]).mockResolvedValueOnce([{data: daily()}, null]);
    render(<InsightsReportCharts report={buildReport()} reportQuery={{}} />);
    fireEvent.click(screen.getByRole('button', {name: 'Daily patterns'}));
    expect(await screen.findByText('Daily failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    await screen.findByRole('button', {name: 'Select daily cell'});
    expect(getReport).toHaveBeenCalledTimes(2);
  });

  it('ignores an earlier daily response after filters change', async () => {
    let oldResolve!: (response: unknown) => void;
    let newResolve!: (response: unknown) => void;
    getReport
      .mockReturnValueOnce(
        new Promise(resolve => {
          oldResolve = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise(resolve => {
          newResolve = resolve;
        }),
      );
    const {rerender} = render(<InsightsReportCharts report={buildReport()} reportQuery={{$categories: ['old']}} />);
    fireEvent.click(screen.getByRole('button', {name: 'Daily patterns'}));
    rerender(<InsightsReportCharts report={buildReport()} reportQuery={{$categories: ['new']}} />);
    await act(async () => {
      oldResolve([{data: daily()}, null]);
    });
    expect(screen.queryByRole('button', {name: 'Select daily cell'})).not.toBeInTheDocument();
    await act(async () => {
      newResolve([{data: daily()}, null]);
    });
    fireEvent.click(screen.getByRole('button', {name: 'Select daily cell'}));
    expect(screen.getByRole('link', {name: 'View transactions on 2026-12-30'}).getAttribute('href')).toContain(
      'cat=new',
    );
  });
});
