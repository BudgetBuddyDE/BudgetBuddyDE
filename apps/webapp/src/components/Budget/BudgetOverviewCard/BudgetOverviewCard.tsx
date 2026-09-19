import {Box, Stack, Tooltip, Typography} from '@mui/material';
import type React from 'react';
import {Card} from '@/components/Card';
import {Formatter} from '@/utils/Formatter';

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
            Budget
          </Typography>
          <Typography variant="h5" component="p" sx={{fontWeight: 600}}>
            {Formatter.currency.formatBalance(totalBudget)}
          </Typography>
        </Box>
      </Card.Header>
      <Card.Body>
        <Stack spacing={2}>
          <Box
            role="img"
            aria-label="Budget progress"
            sx={{display: 'flex', height: 16, overflow: 'hidden', borderRadius: 1, bgcolor: 'action.hover'}}
          >
            <Tooltip title={`Spent · ${Formatter.currency.formatBalance(spent)}`}>
              <Box
                aria-label="Spent"
                sx={{width: `${spentPercent}%`, bgcolor: 'error.main', transition: 'width 300ms'}}
              />
            </Tooltip>
            <Tooltip title={`Upcoming Expenses · ${Formatter.currency.formatBalance(futureExpenses)}`}>
              <Box
                aria-label="Upcoming Expenses"
                sx={{width: `${futurePercent}%`, bgcolor: 'warning.main', transition: 'width 300ms'}}
              />
            </Tooltip>
            <Tooltip
              title={`${isOverBudget ? 'Overdrawn' : 'Available'} · ${Formatter.currency.formatBalance(
                isOverBudget ? overBudgetAmount : available,
              )}`}
            >
              <Box
                aria-label={isOverBudget ? 'Overdrawn' : 'Available'}
                sx={{
                  width: `${availablePercent}%`,
                  bgcolor: isOverBudget ? 'error.main' : 'success.main',
                  transition: 'width 300ms',
                }}
              />
            </Tooltip>
          </Box>

          <Stack spacing={1} component="dl" sx={{m: 0, fontSize: '0.875rem'}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Box aria-hidden sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'error.main'}} />
                <Typography component="dt" color="text.secondary">
                  Spent
                </Typography>
              </Box>
              <Typography component="dd" sx={{m: 0, fontWeight: 500}}>
                {Formatter.currency.formatBalance(spent)}
              </Typography>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Box aria-hidden sx={{width: 12, height: 12, borderRadius: 1, bgcolor: 'warning.main'}} />
                <Typography component="dt" color="text.secondary">
                  Upcoming Expenses
                </Typography>
              </Box>
              <Typography component="dd" sx={{m: 0, fontWeight: 500}}>
                {Formatter.currency.formatBalance(futureExpenses)}
              </Typography>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
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
                  {isOverBudget ? 'Overdrawn' : 'Available'}
                </Typography>
              </Box>
              <Typography component="dd" sx={{m: 0, fontWeight: 500, color: isOverBudget ? 'error.main' : undefined}}>
                {Formatter.currency.formatBalance(isOverBudget ? overBudgetAmount : available)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
};
