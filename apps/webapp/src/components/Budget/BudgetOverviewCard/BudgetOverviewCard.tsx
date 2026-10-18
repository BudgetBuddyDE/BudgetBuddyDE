'use client';

import {Box, Stack, Tooltip, Typography} from '@mui/material';
import type React from 'react';
import {Card} from '@/components/Card';
import {useAppTranslations} from '@/hooks/useAppTranslations';
import {useCurrencyFormatter} from '@/hooks/useCurrencyFormatter';

/** Props for the {@link BudgetOverviewCard} component. */
export type BudgetOverviewCardProps = {
  /** The total budget amount for the period. */
  totalBudget: number;
  /** The amount already spent. */
  spent: number;
  /** The sum of future / planned expenses within the period. */
  futureExpenses: number;
};

/**
 * Displays a budget overview with a progress bar and legend showing how much of the total budget
 * has been spent, is reserved for upcoming expenses, and remains available (or overdrawn).
 */
export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({totalBudget, spent, futureExpenses}) => {
  const t = useAppTranslations();
  const currencyFormatter = useCurrencyFormatter();
  const rawAvailable = totalBudget - spent - futureExpenses;
  const isOverBudget = rawAvailable < 0;
  const available = Math.max(0, rawAvailable);
  const overBudgetAmount = Math.abs(rawAvailable);

  const spentPercent = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;
  const futurePercent =
    totalBudget > 0
      ? isOverBudget
        ? Math.min((futureExpenses / totalBudget) * 100, 100 - spentPercent)
        : (futureExpenses / totalBudget) * 100
      : 0;
  const availablePercent = totalBudget > 0 ? (available / totalBudget) * 100 : 0;

  return (
    <Card>
      <Card.Header>
        <Box>
          <Typography variant="h6" component="h2" sx={{fontWeight: 'bold'}}>
            {t('Budget')}
          </Typography>
          <Typography variant="h5" component="p" sx={{fontWeight: 600}}>
            {currencyFormatter.formatBalance(totalBudget)}
          </Typography>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack spacing={2}>
          <Box
            role="img"
            aria-label={t('Budget progress')}
            sx={{display: 'flex', height: 16, overflow: 'hidden', borderRadius: 1, bgcolor: 'action.hover'}}
          >
            <Tooltip title={t('Spent · {value0}', {value0: currencyFormatter.formatBalance(spent)})}>
              <Box
                aria-label={t('Spent')}
                sx={{width: `${spentPercent}%`, bgcolor: 'error.main', transition: 'width 300ms'}}
              />
            </Tooltip>
            <Tooltip
              title={t('Upcoming Expenses · {value0}', {value0: currencyFormatter.formatBalance(futureExpenses)})}
            >
              <Box
                aria-label={t('Upcoming Expenses')}
                sx={{width: `${futurePercent}%`, bgcolor: 'warning.main', transition: 'width 300ms'}}
              />
            </Tooltip>
            <Tooltip
              title={`${isOverBudget ? t('Overdrawn') : t('Available')} · ${currencyFormatter.formatBalance(
                isOverBudget ? overBudgetAmount : available,
              )}`}
            >
              <Box
                aria-label={isOverBudget ? t('Overdrawn') : t('Available')}
                sx={{
                  width: `${availablePercent}%`,
                  bgcolor: isOverBudget ? 'error.main' : 'success.main',
                  transition: 'width 300ms',
                }}
              />
            </Tooltip>
          </Box>

          <Stack spacing={1} component="dl" sx={{m: 0, fontSize: '0.875rem'}}>
            <Stack direction="row" sx={{alignItems: 'center', justifyContent: 'space-between'}}>
              <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                <Box aria-hidden sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'error.main'}} />
                <Typography component="dt" color="text.secondary">
                  {t('Spent')}
                </Typography>
              </Stack>
              <Typography component="dd" sx={{m: 0, fontWeight: 500}}>
                {currencyFormatter.formatBalance(spent)}
              </Typography>
            </Stack>

            <Stack direction="row" sx={{alignItems: 'center', justifyContent: 'space-between'}}>
              <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                <Box aria-hidden sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'warning.main'}} />
                <Typography component="dt" color="text.secondary">
                  {t('Upcoming Expenses')}
                </Typography>
              </Stack>
              <Typography component="dd" sx={{m: 0, fontWeight: 500}}>
                {currencyFormatter.formatBalance(futureExpenses)}
              </Typography>
            </Stack>

            <Stack direction="row" sx={{alignItems: 'center', justifyContent: 'space-between'}}>
              <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                <Box
                  aria-hidden
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 1,
                    bgcolor: isOverBudget ? 'error.main' : 'success.main',
                  }}
                />
                <Typography component="dt" color="text.secondary">
                  {isOverBudget ? t('Overdrawn') : t('Available')}
                </Typography>
              </Stack>
              <Typography component="dd" sx={{m: 0, fontWeight: 500, color: isOverBudget ? 'error.main' : undefined}}>
                {currencyFormatter.formatBalance(isOverBudget ? overBudgetAmount : available)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
};
