'use client';

import type {TRecurringPaymentOccurrence} from '@budgetbuddyde/api/recurringPayment';
import {BarChart} from '@budgetbuddyde/charts';
import {Alert, Box, Button, LinearProgress, Stack, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';
import {formatDateOnlyForDisplay} from '../dateOnly';
import {aggregateOccurrenceBuckets, loadAllOccurrences, occurrenceTotals} from './occurrenceChartData';
import type {OccurrenceRange} from './occurrenceRange';

export function RecurringPaymentOccurrencesChart({
  range,
  onSelectRange,
}: {
  range: OccurrenceRange;
  onSelectRange: (dateFrom: string, dateTo: string) => void;
}) {
  const [grouping, setGrouping] = React.useState<'day' | 'week'>('day');
  const [data, setData] = React.useState<TRecurringPaymentOccurrence[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData([]);
    void loadAllOccurrences(
      range,
      query => apiClient.backend.recurringPayment.getOccurrences(query),
      () => cancelled,
    )
      .then(result => {
        if (!cancelled && result) setData(result);
      })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof Error ? reason : new Error(String(reason)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, retry]);
  const buckets = React.useMemo(() => aggregateOccurrenceBuckets(data, range, grouping), [data, range, grouping]);
  const totals = React.useMemo(() => occurrenceTotals(data, range), [data, range]);
  const peaks = [...buckets]
    .filter(bucket => bucket.count > 0)
    .sort((a, b) => b.expenses - a.expenses || a.dateFrom.localeCompare(b.dateFrom))
    .slice(0, 5);
  const periodLabel = (from: string, to: string) =>
    from === to
      ? formatDateOnlyForDisplay(from)
      : `${formatDateOnlyForDisplay(from)} to ${formatDateOnlyForDisplay(to)}`;
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Planned payment peaks</Card.Title>
          <Card.Subtitle>
            {periodLabel(range.dateFrom, range.dateTo)}
            {range.includePaused ? ' · Including paused rules' : ''}
          </Card.Subtitle>
        </Box>
        <Card.HeaderActions>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={grouping}
            aria-label="Payment plan grouping"
            onChange={(_, value: 'day' | 'week' | null) => {
              if (value) setGrouping(value);
            }}
          >
            <ToggleButton value="day">Daily</ToggleButton>
            <ToggleButton value="week">Weekly</ToggleButton>
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
          Scheduled amounts for the table filters. These are planned payments, not booked transactions or an account
          balance.
        </Typography>
        {loading ? (
          <LinearProgress aria-label="Loading complete payment plan" />
        ) : error ? (
          <Alert severity="error" action={<Button onClick={() => setRetry(value => value + 1)}>Retry</Button>}>
            {error.message}
          </Alert>
        ) : !data.length ? (
          <Typography>No planned payments in this date range.</Typography>
        ) : (
          <>
            <Typography variant="body2">
              Planned income: {Formatter.currency.formatBalance(totals.income)} · Planned expenses:{' '}
              {Formatter.currency.formatBalance(totals.expenses)}
            </Typography>
            <Box sx={{overflowX: 'auto'}}>
              <Box sx={{minWidth: buckets.length > 20 ? Math.max(700, buckets.length * 20) : 0}}>
                <BarChart
                  data={buckets}
                  xKey="label"
                  series={[
                    {key: 'income', label: 'Planned income', role: 'income'},
                    {key: 'expenses', label: 'Planned expenses', role: 'expense'},
                  ]}
                  showLegend
                  height={280}
                  ariaLabel="Planned recurring income and expenses by scheduled date"
                  xTickFormatter={value => formatDateOnlyForDisplay(String(value))}
                  axisValueFormatter={value => Formatter.currency.shortenBalance(value)}
                  tooltipValueFormatter={value => Formatter.currency.formatBalance(value)}
                />
              </Box>
            </Box>
            <Typography variant="body2" sx={{mt: 1}}>
              Select a period to inspect its scheduled payments. Highest expenses first.
            </Typography>
            <Stack direction="row" sx={{flexWrap: 'wrap', gap: 1, mt: 1}}>
              {peaks.map(bucket => (
                <Button
                  key={bucket.dateFrom}
                  size="small"
                  variant="outlined"
                  onClick={() => onSelectRange(bucket.dateFrom, bucket.dateTo)}
                >
                  {periodLabel(bucket.dateFrom, bucket.dateTo)}: {Formatter.currency.formatBalance(bucket.expenses)}{' '}
                  expenses · {Formatter.currency.formatBalance(bucket.income)} income
                </Button>
              ))}
            </Stack>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
