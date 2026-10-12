'use client';

import {BulletChart} from '@budgetbuddyde/charts';
import {Stack, Typography} from '@mui/material';
import React from 'react';
import {Formatter} from '@/utils/Formatter';

export type BudgetUtilizationRow = {id: string; name: string; budget: number; spent: number};

/** Each row compares spending with its own limit; amounts are never summed across overlapping budgets. */
export const BudgetUtilizationChart: React.FC<{budgets: BudgetUtilizationRow[]}> = ({budgets}) => {
  const positiveLimits = budgets.filter(row => row.budget > 0);
  const withoutLimits = budgets.filter(row => row.budget <= 0);
  const data = [...positiveLimits]
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
    .map(row => ({
      label: `${row.name}: ${Formatter.currency.formatBalance(row.spent)} of ${Formatter.currency.formatBalance(row.budget)}`,
      actual: (row.spent / row.budget) * 100,
      target: 100,
      max: Math.max(100, (row.spent / row.budget) * 100),
    }));
  return (
    <Stack spacing={2}>
      {data.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary">
            Spending as a share of each limit. The marker is 100%; exceeded limits extend the scale.
          </Typography>
          <BulletChart data={data} valueFormatter={value => value.toFixed(1) + '%'} />
        </>
      )}
      {withoutLimits.map(row => (
        <Typography key={row.id} variant="body2">
          {row.name}: {Formatter.currency.formatBalance(row.spent)} spent. No positive budget limit.
        </Typography>
      ))}
      {budgets.length === 0 && <Typography color="text.secondary">No budgets to compare.</Typography>}
    </Stack>
  );
};
