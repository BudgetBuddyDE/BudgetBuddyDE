'use client';

import React from 'react';
import NextLink from 'next/link';
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { ErrorAlert as ErrorComp } from '@/components/ErrorAlert';
import { Card } from '@/components/Card';
import { PieChart, type PieChartData } from '@/components/Charts';
import { CircularProgress } from '@/components/Loading';
import { NoResults } from '@/components/NoResults';
import { Formatter } from '@/utils/Formatter';
import { CategoryService } from '@/services/Category.service';

export type CategoryPieChartTimeframe = 'MONTH' | 'YTD' | 'ALL_TIME';
export type CategoryPieChartTransactionType = 'INCOME' | 'EXPENSE';

type CategoryStats = {
  category: { ID: string; name: string };
  balance: number;
  income: number;
  expenses: number;
};

export type CategoryPieChartProps = {
  title: string;
  subtitle?: string;
  // FIXME: Change default to 'MONTH' later
  defaultTimeframe?: CategoryPieChartTimeframe;
  transactionsType: CategoryPieChartTransactionType;
  withViewMore?: boolean;
};

/**
 * Meta configuration for each timeframe:
 * - Display label
 * - Date range function
 * - Empty-state text
 */
const TIMEFRAME_META: Record<
  CategoryPieChartTimeframe,
  { label: string; range: () => [Date, Date]; emptyText: string }
> = {
  MONTH: {
    label: 'Month',
    range: () => {
      const now = new Date();
      return [
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      ];
    },
    emptyText: 'There are no transactions for this month!',
  },
  YTD: {
    label: 'YTD',
    range: () => {
      const now = new Date();
      return [new Date(now.getFullYear(), 0, 1), now];
    },
    emptyText: 'There are no transactions for this year!',
  },
  ALL_TIME: {
    label: 'All Time',
    range: () => {
      const now = new Date();
      return [new Date('1900-01-01'), now];
    },
    emptyText: 'There are no transactions for all time!',
  },
};

const TIMEFRAMES: CategoryPieChartTimeframe[] = ['MONTH', 'YTD', 'ALL_TIME'];

/** Local data/loading/error state */
type State = {
  data: Partial<Record<CategoryPieChartTimeframe, CategoryStats[]>>;
  loading: Partial<Record<CategoryPieChartTimeframe, boolean>>;
  error: Partial<Record<CategoryPieChartTimeframe, string | undefined>>;
};

type Action =
  | { type: 'start'; tf: CategoryPieChartTimeframe }
  | { type: 'success'; tf: CategoryPieChartTimeframe; payload: CategoryStats[] }
  | { type: 'error'; tf: CategoryPieChartTimeframe; message: string };

const initialState: State = {
  data: {},
  loading: {},
  error: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        loading: { ...state.loading, [action.tf]: true },
        error: { ...state.error, [action.tf]: undefined },
      };
    case 'success':
      return {
        data: { ...state.data, [action.tf]: action.payload },
        loading: { ...state.loading, [action.tf]: false },
        error: { ...state.error, [action.tf]: undefined },
      };
    case 'error':
      return {
        ...state,
        loading: { ...state.loading, [action.tf]: false },
        error: { ...state.error, [action.tf]: action.message },
      };
    default:
      return state;
  }
}

export function CategoryPieChart({
  title,
  subtitle,
  // FIXME: Change default to 'MONTH' later
  defaultTimeframe = 'YTD',
  transactionsType,
  withViewMore = false,
}: CategoryPieChartProps) {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [currentTimeframe, setCurrentTimeframe] =
    React.useState<CategoryPieChartTimeframe>(defaultTimeframe);

  // Track mount status to avoid setState on unmounted component
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch stats for a given timeframe (cached after first load)
  const fetchData = React.useCallback(
    async (timeframe: CategoryPieChartTimeframe) => {
      if (state.data[timeframe]) return; // use cached data

      dispatch({ type: 'start', tf: timeframe });

      try {
        const [start, end] = TIMEFRAME_META[timeframe].range();
        const [raw, err] = await CategoryService.getCategoryStats({ start, end });
        if (err) throw err;

        const normalized: CategoryStats[] = raw.map((d: any) => ({
          category: { ID: d.toCategory.ID, name: d.toCategory.name },
          balance: d.balance,
          income: d.income,
          expenses: d.expenses,
        }));

        dispatch({ type: 'success', tf: timeframe, payload: normalized });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        dispatch({ type: 'error', tf: timeframe, message });
      }
    },
    [state.data]
  );

  // Initial load + when default timeframe changes
  React.useEffect(() => {
    void fetchData(currentTimeframe);
  }, [currentTimeframe, fetchData]);

  // Handle toggle button change (ignore deselect on exclusive group)
  const handleTimeframeChange = (
    _: React.MouseEvent<HTMLElement>,
    next: CategoryPieChartTimeframe | null
  ) => {
    if (!next || next === currentTimeframe) return;
    setCurrentTimeframe(next);
  };

  const stats = state.data[currentTimeframe];
  const isLoading =
    Boolean(state.loading[currentTimeframe]) || (!stats && !state.error[currentTimeframe]);
  const error = state.error[currentTimeframe];

  const chartData = React.useMemo(
    () => (stats ? toPieData(stats, transactionsType) : []),
    [stats, transactionsType]
  );

  const totalValue = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0),
    [chartData]
  );

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>{title}</Card.Title>
          {Boolean(subtitle) && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>
        <Card.HeaderActions
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}
        >
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={currentTimeframe}
            onChange={handleTimeframeChange}
            exclusive
            aria-label="Select timeframe"
            disabled={isLoading} // <-- important change
          >
            {TIMEFRAMES.map((tf) => (
              <ToggleButton key={tf} value={tf} aria-label={TIMEFRAME_META[tf].label}>
                {TIMEFRAME_META[tf].label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body sx={{ pt: 1 }}>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <ErrorComp error={error} />
        ) : chartData.length > 0 ? (
          <PieChart
            fullWidth
            primaryText={Formatter.currency.formatBalance(totalValue)}
            secondaryText={transactionsType === 'EXPENSE' ? 'Expenses' : 'Income'}
            series={[
              {
                data: chartData,
                valueFormatter: (value) => Formatter.currency.formatBalance(value.value),
              },
            ]}
          />
        ) : (
          <NoResults text={TIMEFRAME_META[currentTimeframe].emptyText} />
        )}
      </Card.Body>
      {!isLoading && withViewMore && (
        <Card.Footer>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              LinkComponent={NextLink}
              href="/transactions"
              aria-label="View more transactions"
            >
              View more...
            </Button>
          </Stack>
        </Card.Footer>
      )}
    </Card>
  );
}

/**
 * Convert raw category stats into PieChart data format
 */
function toPieData(stats: CategoryStats[], type: CategoryPieChartTransactionType): PieChartData[] {
  const pick: keyof CategoryStats = type === 'INCOME' ? 'income' : 'expenses';
  return stats
    .map((s) => ({ label: s.category.name, value: s[pick] }))
    .filter((d) => (Number.isFinite(d.value) ? (d.value as number) > 0 : false));
}
