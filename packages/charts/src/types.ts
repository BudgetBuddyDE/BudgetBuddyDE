export type ValueFormatter = (value: number) => string;
export type SeriesRole = 'balance' | 'income' | 'expense' | 'target' | 'warning';

export type ChartDataRow = Record<string, string | number | null | undefined>;

export type BaseChartProps = {
  /** Chart height in px. Default: 300 */
  height?: number;
  /** Fixed width in px. When omitted the chart fills its parent container. */
  width?: number;
  /** Formats numeric values in axes and tooltips. */
  valueFormatter?: ValueFormatter;
  /** Axis-only format, usually compact. Falls back to valueFormatter. */
  axisValueFormatter?: ValueFormatter;
  /** Exact tooltip format. Falls back to valueFormatter. */
  tooltipValueFormatter?: ValueFormatter;
  ariaLabel?: string;
  /** Show the chart legend. Default: false */
  showLegend?: boolean;
  /** Show the cartesian grid. Default: true */
  showGrid?: boolean;
  /** Hide the tooltip. Default: false */
  hideTooltip?: boolean;
  /** Enable mount animations. Default: false */
  animate?: boolean;
};

export type CartesianSeriesConfig = {
  /** Key of the series inside each data row. */
  key: string;
  /** Display label. */
  label: string;
  /** Optional explicit color. */
  color?: string;
  colorId?: string;
  role?: SeriesRole;
  valueFormatter?: ValueFormatter;
  /** Stack id (e.g. for stacked bars/areas). */
  stackId?: string;
  /** Dash pattern for line/area strokes. */
  strokeDasharray?: string;
};
