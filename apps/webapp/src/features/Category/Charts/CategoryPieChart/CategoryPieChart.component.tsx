import {Box, Button, Skeleton, Stack, ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {Link} from 'react-router-dom';

import {Card} from '@/components/Base/Card';
import {PieChart, type TPieChartData} from '@/components/Base/Charts';
import {CircularProgress} from '@/components/Loading';
import {NoResults} from '@/components/NoResults';
import {Formatter} from '@/services/Formatter';

import {type TCategoryStats} from '../../Category.types';
import {useCategories} from '../../useCategories.hook';

export type TCategoryPieChartTimeframe = 'MONTH' | 'YTD' | 'ALL_TIME';

export type TCategoryPieChartTransactionType = 'INCOME' | 'EXPENSE';

export const CATEGORY_PIE_CHART_TIMEFRAMES: readonly {type: TCategoryPieChartTimeframe; text: string}[] = [
  {
    type: 'MONTH',
    text: 'Month',
  },
  {
    type: 'YTD',
    text: 'YTD',
  },
  {
    type: 'ALL_TIME',
    text: 'All Time',
  },
];

export type TCategoryPieChartProps = {
  title: string;
  subtitle?: string;
  defaultTimeframe?: TCategoryPieChartTimeframe;
  transactionsType: TCategoryPieChartTransactionType;
  withViewMore?: boolean;
};

/**
 * Renders a pie chart component for displaying category data.
 *
 * @component
 * @example
 * ```tsx
 * <CategoryPieChart
 *   title="Category Chart"
 *   subtitle="Monthly Expenses"
 *   defaultTimeframe="MONTH"
 *   transactionsType="EXPENSE"
 * />
 * ```
 *
 * @returns {React.FC<TCategoryPieChartProps>} The rendered CategoryPieChart component.
 */
export const CategoryPieChart: React.FC<TCategoryPieChartProps> = ({
  title,
  subtitle,
  defaultTimeframe = 'MONTH',
  transactionsType,
  withViewMore = false,
}) => {
  const {getStats} = useCategories();
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentTimeframe, setCurrentTimeframe] = React.useState<TCategoryPieChartTimeframe>(defaultTimeframe);
  const [data, setData] = React.useState<Record<TCategoryPieChartTimeframe, TCategoryStats | null>>({
    MONTH: null,
    YTD: null,
    ALL_TIME: null,
  });

  const getDateRange = (timeframe: TCategoryPieChartTimeframe): [Date, Date] => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    switch (timeframe) {
      case 'ALL_TIME':
        // Sending a startDate way back in time to get all transactions, because we wanna catch all processed transactions
        return [new Date('1900-01-01'), now];
      case 'YTD':
        return [new Date(year, 0, 1), now];
      case 'MONTH':
        return [new Date(year, month, 1), new Date(year, month, 31)];
    }
  };

  const onChangeCurrentTimeframe = (event: React.BaseSyntheticEvent) => {
    setCurrentTimeframe(event.target.value);
  };

  const chartData: TPieChartData[] = React.useMemo(() => {
    if (!data[currentTimeframe]) return [];
    const stats = data[currentTimeframe].categories;
    return stats
      .map(stat => ({
        label: stat.category.name,
        value: transactionsType === 'INCOME' ? stat.income : stat.expenses,
      }))
      .filter(({value}) => value > 0);
  }, [data, currentTimeframe, transactionsType]);

  const fetchData = React.useCallback(async () => {
    if (!isLoading) setIsLoading(true);
    const [startDate, endDate] = getDateRange(currentTimeframe);
    const [budget, err] = await getStats(startDate, endDate);
    setIsLoading(false);
    if (err) {
      console.error(err);
      return;
    }
    setData(prev => ({...prev, [currentTimeframe]: budget}));
  }, [currentTimeframe]);

  React.useEffect(() => {
    fetchData();
  }, [currentTimeframe]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>{title}</Card.Title>
          {subtitle !== undefined && Boolean(subtitle) && <Card.Subtitle>{subtitle}</Card.Subtitle>}
        </Box>

        {isLoading ? (
          <Skeleton variant="rounded" width={'25%'} height={30} />
        ) : (
          <Card.HeaderActions sx={{display: 'flex', flexDirection: 'row'}}>
            <ToggleButtonGroup
              size="small"
              color="primary"
              value={currentTimeframe}
              onChange={onChangeCurrentTimeframe}
              exclusive>
              {CATEGORY_PIE_CHART_TIMEFRAMES.map(button => (
                <ToggleButton key={button.type} value={button.type}>
                  {button.text}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Card.HeaderActions>
        )}
      </Card.Header>
      <Card.Body sx={{pt: 1}}>
        {isLoading ? (
          <CircularProgress />
        ) : chartData.length > 0 ? (
          <PieChart
            fullWidth
            primaryText={Formatter.formatBalance(chartData.reduce((acc, curr) => acc + curr.value, 0))}
            secondaryText={transactionsType === 'EXPENSE' ? 'Expenses' : 'Income'}
            series={[
              {
                data: chartData,
                valueFormatter: value => Formatter.formatBalance(value.value),
              },
            ]}
          />
        ) : (
          <NoResults text={getNoResultsMessage(currentTimeframe)} />
        )}
      </Card.Body>
      {!isLoading && withViewMore && (
        <Card.Footer>
          <Stack direction="row" justifyContent={'flex-end'}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*@ts-expect-error*/}
            <Button LinkComponent={Link} to="/transactions">
              View more...
            </Button>
          </Stack>
        </Card.Footer>
      )}
    </Card>
  );
};

/**
 * Returns the appropriate "no results" message based on the given timeframe.
 *
 * @param timeframe - The timeframe for which the message is generated.
 * @returns The "no results" message.
 */
export function getNoResultsMessage(timeframe: TCategoryPieChartTimeframe): string {
  switch (timeframe) {
    case 'MONTH':
      return 'There are no transactions for this month!';
    case 'YTD':
      return 'There are no transactions for this year!';
    case 'ALL_TIME':
      return 'There are no transactions for all time!';
  }
}
