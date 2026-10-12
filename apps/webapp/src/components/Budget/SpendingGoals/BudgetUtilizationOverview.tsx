'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import {Button, LinearProgress, Link, Stack, Typography} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import {apiClient} from '@/apiClient';
import {Card} from '@/components/Card';
import {ErrorAlert} from '@/components/ErrorAlert';
import {budgetSlice} from '@/lib/features/budgets/budgetSlice';
import {useAppSelector} from '@/lib/hooks';
import {buildIntentHref} from '@/lib/ibn/url';
import {BudgetUtilizationChart} from './BudgetUtilizationChart';

export function BudgetUtilizationOverview() {
  const {data: budgetPage, status} = useAppSelector(budgetSlice.selectors.getState);
  const [budgets, setBudgets] = React.useState<TBudget[]>([]);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    let ignore = false;
    if (status === 'loading') return;
    setLoading(true);
    setError(null);
    // An unbounded budget request is supported by the existing list contract.
    // Redux pages only trigger refresh; they must not supply a partial comparison.
    void apiClient.backend.budget.getAll({}).then(([result, requestError]) => {
      if (ignore) return;
      if (requestError || !result) {
        setError(requestError ?? new Error('Budget comparison is unavailable'));
      } else {
        setBudgets(result.data ?? []);
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [budgetPage, status, retry]);
  return (
    <Card>
      <Card.Header>
        <Stack>
          <Card.Title>Budget utilization</Card.Title>
          <Card.Subtitle>Recorded expenses this month, across all budgets</Card.Subtitle>
        </Stack>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <LinearProgress aria-label="Loading budget comparison" />
        ) : error ? (
          <ErrorAlert error={error} action={<Button onClick={() => setRetry(value => value + 1)}>Retry</Button>} />
        ) : (
          <Stack spacing={2}>
            <BudgetUtilizationChart budgets={budgets.map(row => ({...row, spent: row.balance}))} />
            {budgets.map(row => (
              <Typography key={row.id} variant="body2">
                <Link component={NextLink} href={buildIntentHref({entity: 'budget', action: 'edit', id: row.id})}>
                  Edit {row.name}
                </Link>
              </Typography>
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card>
  );
}
