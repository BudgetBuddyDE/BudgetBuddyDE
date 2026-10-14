import {cleanup, render} from '@testing-library/react';
import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {buildReport} from './InsightsReport.fixtures';

const {composedChartProps} = vi.hoisted(() => ({composedChartProps: vi.fn()}));

vi.mock('@budgetbuddyde/charts', () => ({
  ComposedChart: (props: unknown) => {
    composedChartProps(props);
    return <div data-testid="composed-chart" />;
  },
}));

import {InsightsReportCharts} from './InsightsReportCharts';

afterEach(() => {
  cleanup();
  composedChartProps.mockReset();
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
