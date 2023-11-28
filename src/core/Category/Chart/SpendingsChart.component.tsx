import {
  ActionPaper,
  Card,
  ListWithIcon,
  NoResults,
  PieChart,
  type TPieChartData,
} from '@/components/Base';
import { CircularProgress } from '@/components/Loading';
import { DateService } from '@/services';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { PieChartRounded, ListRounded } from '@mui/icons-material';
import { ParentSize } from '@visx/responsive';
import React from 'react';
import { useFetchTransactions } from '../../Transaction';
import { isSameMonth } from 'date-fns';

export type TChartType = 'MONTH' | 'ALL_TIME';

export type TVisualizationStyle = 'CHART' | 'LIST';

export const SPENDING_CHART_TYPES: { type: TChartType; text: string }[] = [
  {
    type: 'MONTH',
    text: DateService.shortMonthName() + '.',
  },
  { type: 'ALL_TIME', text: 'All' },
];

export type TCategorySpendingsChartProps = {
  withList?: boolean;
};

export const CategorySpendingsChart: React.FC<TCategorySpendingsChartProps> = ({
  withList = false,
}) => {
  const [chart, setChart] = React.useState<TChartType>('MONTH');
  const [visualizationStyle, setVisualizationStyle] = React.useState<TVisualizationStyle>('CHART');
  const { loading: loadingTransactions, transactions } = useFetchTransactions();

  const currentChartData: TPieChartData[] = React.useMemo(() => {
    const now = new Date();
    const expensesByCategory = new Map<string, number>();
    transactions
      .filter(({ transferAmount, processedAt }) => {
        return transferAmount < 0 && (chart === 'MONTH' ? isSameMonth(processedAt, now) : true);
      })
      .forEach(({ category: { name }, transferAmount }) => {
        const currAmount = expensesByCategory.get(name);
        if (currAmount) {
          expensesByCategory.set(name, currAmount + Math.abs(transferAmount));
        } else expensesByCategory.set(name, Math.abs(transferAmount));
      });

    return [...expensesByCategory.entries()].map(
      ([category, amount]) => ({ label: category, value: amount } as TPieChartData)
    );
  }, [transactions, chart]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Spendings</Card.Title>
          <Card.Subtitle>Categorized Spendings</Card.Subtitle>
        </Box>
        <Card.HeaderActions sx={{ display: 'flex', flexDirection: 'row' }}>
          <ActionPaper>
            <ToggleButtonGroup
              size="small"
              color="primary"
              value={chart}
              onChange={(event: React.BaseSyntheticEvent) => setChart(event.target.value)}
              exclusive
            >
              {SPENDING_CHART_TYPES.map((button) => (
                <ToggleButton key={button.type} value={button.type}>
                  {button.text}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </ActionPaper>

          {withList && (
            <ActionPaper>
              <ToggleButtonGroup
                size="small"
                color="primary"
                value={visualizationStyle}
                onChange={(event: React.BaseSyntheticEvent) =>
                  setVisualizationStyle(event.target.value)
                }
                exclusive
              >
                <ToggleButton value={'CHART' as TVisualizationStyle}>
                  <PieChartRounded />
                </ToggleButton>

                <ToggleButton value={'LIST' as TVisualizationStyle}>
                  <ListRounded />
                </ToggleButton>
              </ToggleButtonGroup>
            </ActionPaper>
          )}
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        {loadingTransactions ? (
          <CircularProgress />
        ) : currentChartData.length > 0 ? (
          visualizationStyle === 'LIST' && withList ? (
            <Box>
              {currentChartData.map(({ label, value }) => (
                <ListWithIcon title={label} amount={value} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flex: 1, mt: '1rem' }}>
              <ParentSize>
                {({ width }) => (
                  <PieChart
                    width={width}
                    height={width}
                    data={currentChartData}
                    formatAsCurrency
                    showTotalSum
                  />
                )}
              </ParentSize>
            </Box>
          )
        ) : (
          <NoResults sx={{ mt: 2 }} />
        )}
      </Card.Body>
    </Card>
  );
};
