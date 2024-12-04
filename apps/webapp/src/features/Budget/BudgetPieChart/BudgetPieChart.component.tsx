import {Box} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {PieChart} from '@/components/Base/Charts';
import {CircularProgress} from '@/components/Loading';
import {useTransactions} from '@/features/Transaction';
import {type TTransactionBudget} from '@/features/Transaction/Transaction.types';
import {Formatter} from '@/services/Formatter';

export type TBudgetPieChartProps = {};

/**
 * Renders a pie chart component for displaying budget information.
 *
 * @component
 * @example
 * ```tsx
 * <BudgetPieChart />
 * ```
 */
export const BudgetPieChart: React.FC<TBudgetPieChartProps> = () => {
  const {getBudget} = useTransactions();
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<TTransactionBudget | null>(null);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return [
      {
        id: 'current-expenses',
        label: 'Current Expenses',
        value: data.expenses,
      },
      {
        id: 'future-expenses',
        label: 'Future Expenses',
        value: data.upcomingExpenses,
      },
      {
        id: 'free-amount',
        label: 'Free Amount',
        value: data.freeAmount,
      },
    ].filter(({value}) => value > 0);
  }, [data]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!isLoading) setIsLoading(true);
      const now = new Date();
      const [budget, err] = await getBudget(
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      );
      setIsLoading(false);
      if (err) {
        console.error(err);
        return;
      }
      setData(budget);
    };
    fetchData();
  }, []);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Budget</Card.Title>
          <Card.Subtitle>How much can you spend?</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{pt: 1}}>
        {isLoading || !data ? (
          <CircularProgress />
        ) : (
          <PieChart
            fullWidth
            primaryText={Formatter.formatBalance(data!.expenses + data!.upcomingExpenses)}
            secondaryText="Expenses"
            series={[
              {
                data: chartData,
                valueFormatter: value => Formatter.formatBalance(value.value),
              },
            ]}
          />
        )}
      </Card.Body>
    </Card>
  );
};
