'use client';

import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import {TableChartRounded} from '@mui/icons-material';
import {Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from '@mui/material';
import {subMonths} from 'date-fns';
import React from 'react';
import {apiClient} from '@/apiClient';
import {ActionPaper} from '@/components/ActionPaper';
import {Card} from '@/components/Card';
import {ErrorAlert} from '@/components/ErrorAlert';
import {DateRangePicker, type DateRangeState} from '@/components/Form/DateRangePicker';
import {NoResults} from '@/components/NoResults';
import {useFetch} from '@/hooks/useFetch';
import {Formatter} from '@/utils/Formatter';

export type HistoricalDataType = 'BASIC' | 'GROUPED_BY_CATEGORY';

export type HistoricalBalanceTableProps = {
  type: HistoricalDataType;
  dense?: boolean;
};

export const HistoricalBalanceTable: React.FC<HistoricalBalanceTableProps> = ({type, dense = false}) => {
  const DEFAULT_DATE_RANGE = {
    startDate: subMonths(new Date(), type === 'BASIC' ? 12 : 1),
    endDate: new Date(),
  } satisfies DateRangeState;
  const showCategory = type === 'GROUPED_BY_CATEGORY';
  const [dateRange, setDateRange] = React.useState(DEFAULT_DATE_RANGE);
  const fetchDataFunc = React.useCallback(async () => {
    const [results, error] = showCategory
      ? await apiClient.backend.insights.getHistoricalCategoryBalance({
          $dateFrom: dateRange.startDate,
          $dateTo: dateRange.endDate,
        })
      : await apiClient.backend.insights.getHistoricalBalance({
          $dateFrom: dateRange.startDate,
          $dateTo: dateRange.endDate,
        });
    if (error) throw error;
    return results.data.toReversed();
  }, [dateRange, showCategory]);
  const {isLoading, data, error} = useFetch<THistoricalBalance[] | THistoricalCategoryBalance[]>(fetchDataFunc);
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    if (!start || !end) {
      console.warn(
        'HistoricalBalanceLineChart: Both start and end dates must be provided. Reverting to default date range.',
      );
      setDateRange(DEFAULT_DATE_RANGE);
      return;
    }

    setDateRange({startDate: start, endDate: end});
  };

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Stack>
          <Card.Title>Historical balance ({data?.length})</Card.Title>
          <Card.Subtitle>{showCategory ? 'Grouped by date and category' : 'Grouped by date'}</Card.Subtitle>
        </Stack>

        {isLoading ||
          (!isLoading && data && data.length > 0 && (
            <Card.HeaderActions actionPaperProps={{sx: {p: 1}}}>
              {isLoading ? (
                <Skeleton variant={'rounded'} width={300} height={36} />
              ) : (
                <DateRangePicker
                  size={'small'}
                  defaultValue={DEFAULT_DATE_RANGE}
                  slotProps={{
                    startDateTicker: {
                      openTo: 'month',
                      view: 'month',
                    },
                    endDateTicker: {
                      openTo: 'month',
                      view: 'month',
                    },
                  }}
                  onDateRangeChange={handleDateRangeChange}
                />
              )}
            </Card.HeaderActions>
          ))}
      </Card.Header>
      <Card.Body>
        {error !== null && <ErrorAlert error={error} sx={{m: 2}} />}
        {!isLoading && data && data.length === 0 && (
          <NoResults
            icon={<TableChartRounded />}
            text={'Create a transaction to begin tracking your activity.'}
            sx={{m: 2}}
          />
        )}
        {!isLoading && data && data.length > 0 && (
          <TableContainer component={ActionPaper}>
            <Table size={dense ? 'small' : 'medium'} aria-label="historical balance table">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  {showCategory && <TableCell>Category</TableCell>}
                  <TableCell align="right">Income</TableCell>
                  <TableCell align="right">Expenses</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => {
                  const date = new Date(row.date);
                  return (
                    <TableRow key={`${date.getTime()}-${index}`} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                      <TableCell component="th" scope="row">
                        {Formatter.date.formatWithPattern(date, 'MMMM yyyy')}
                      </TableCell>
                      {showCategory && 'category' in row && <TableCell>{row.category.name || '-'}</TableCell>}
                      <TableCell align="right">{Formatter.currency.formatBalance(row.income)}</TableCell>
                      <TableCell align="right">{Formatter.currency.formatBalance(row.expenses)}</TableCell>
                      <TableCell align="right">{Formatter.currency.formatBalance(row.balance)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card.Body>
    </Card>
  );
};
