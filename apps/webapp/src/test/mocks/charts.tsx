import type {ReactNode} from 'react';
import {vi} from 'vite-plus/test';

export const composedChartMock = {
  render: undefined as undefined | (() => ReactNode),
  onProps: vi.fn(),
};

/** Stub for the chart primitive; real chart exports stay available. */
export function ComposedChart(props: unknown) {
  composedChartMock.onProps(props);
  return composedChartMock.render ? composedChartMock.render() : <div data-testid="composed-chart" />;
}

export function resetChartsMock(): void {
  composedChartMock.render = undefined;
  composedChartMock.onProps.mockReset();
}
