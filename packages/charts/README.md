# BudgetBuddyDE Charts

Finance-oriented Recharts wrappers that inherit the application's MUI theme.
Use package imports, not internal `src` paths. Build through Turborepo before
consuming compiled exports.

## Formatting and series identity

```tsx
import {LineChart} from '@budgetbuddyde/charts';

<LineChart
  data={[{month: 'January', balance: 1234.56}]}
  xKey="month"
  series={[{key: 'balance', label: 'Balance', role: 'balance'}]}
  axisValueFormatter={value => `${Math.round(value / 1000)}k EUR`}
  tooltipValueFormatter={value => `${value.toFixed(2)} EUR`}
  ariaLabel="Monthly account balance"
  showEndLabel
/>;
```

- `valueFormatter` remains the backward-compatible fallback for both formats.
- Series-level `valueFormatter` overrides tooltip formatting for that series.
- Roles: `balance`, `income`, `expense`, `target`, `warning`.
- `colorId` (or `key`) chooses a stable categorical color regardless of sorting.
  Finite palettes can collide; supply explicit colors for known category sets
  when each category must be unique. Large category sets need aggregation or
  small multiples, not additional indistinguishable colors.
- Explicit `color` overrides the palette; consumers must check its contrast
  and provide a suitable dark-mode alternative themselves.

## Presentation and interaction

Chart colors are local CSS variables emitted in the sizing primitive. MUI
`applyStyles` switches them before hydration. No extra theme provider is needed.
Fonts follow MUI typography; numbers use tabular figures. `ParentSize` observes
container resizing and caps fixed widths to available space.

Cartesian and radar legends are keyboard-operable visibility controls.
Tooltips show exact values with separate units per series. Native charts use
Recharts' accessibility layer; this is not a WCAG compliance guarantee.
Heatmap and OHLC charts use one tab stop with arrow-key navigation and visible
details. A screen-reader description and data table should accompany complex
charts. The webapp's `/charts` gallery demonstrates a collapsible data view.

Animations are off by default, brief when enabled, and disabled for reduced
motion. Line plots are linear by default; curves are opt-in. End labels are
suppressed on narrow containers to preserve usable plot width.

## Specialized charts

- Waterfall uses floating value ranges, including changes across zero. Its
  tooltip exposes the signed change and closing balance, not layout offsets.
- Heatmap separates zero from missing/null values; missing values are hatched.
  It includes a continuous scale legend and a selectable amount description.
- Bullet expands its range for overruns instead of clipping the actual value.
- OHLC uses hollow rising and filled falling candles, not color alone.
- Sunburst computes parent totals from descendants when absent.
- Sankey labels nodes with names and values. Dense flows need enough space;
  labels can require aggregation for very narrow screens.
- Funnel represents descending stages of the same process, not budget parts.
- Dual-axis charts require explicit axis titles and explanatory context;
  values on different axes cannot be compared by height.

Heatmap, Bullet and Candlestick are custom components within this package,
not native Recharts chart types.

## Validation

```bash
pnpm exec turbo run build typecheck test format:check lint:check --filter=@budgetbuddyde/charts --filter=@budgetbuddyde/webapp
```

The webapp tests load the local package sources and prebundle Recharts to
avoid CommonJS/ESM issues under Vitest's VM pool. Production still consumes
the compiled package exports. Check `/charts` in light/dark, on mobile, and
with keyboard interaction before changing chart defaults.
