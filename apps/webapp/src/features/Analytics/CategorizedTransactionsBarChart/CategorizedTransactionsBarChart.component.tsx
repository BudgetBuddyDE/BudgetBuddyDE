import {type TCategory} from '@budgetbuddyde/types';
import {Box} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {BarChart} from '@/components/Base/Charts';
import {CircularProgress} from '@/components/Loading';
import {useTransactions} from '@/features/Transaction';
import {useScreenSize} from '@/hooks/useScreenSize';
import {Formatter} from '@/services/Formatter';

enum Prefix {
  Income = 'income_',
  Expense = 'expense_',
}
type TChartData = {
  series: {
    dataKey: `${Prefix}${TCategory['id']}`;
    label: TCategory['name'];
    stack: 'income' | 'expense';
    valueFormatter: (v: number | null) => string;
  }[];
  data: ({
    date: Date;
  } & Record<`${Prefix}${TCategory['id']}`, number>)[];
};

export const CategorizedTransactionsBarChart: React.FC = () => {
  const screenSize = useScreenSize();
  const {isLoading: isLoadingTransactions, data: transactions} = useTransactions();

  const ChartData: TChartData = React.useMemo(() => {
    if (!transactions) return {series: [], data: []};

    const translations = new Map<`${Prefix}${TCategory['id']}`, TCategory['name']>();
    const temp = new Map<
      string,
      {
        income: Map<TCategory['id'], number>;
        expense: Map<TCategory['id'], number>;
      }
    >(); // key => year-month

    for (const {
      processed_at,
      transfer_amount,
      expand: {
        category: {id: categoryId, name: categoryName},
      },
    } of transactions) {
      const mapKey = format(processed_at, 'yyyy-MM');
      const isIncome = transfer_amount > 0;
      const absTransAmnt = Math.abs(transfer_amount);

      if (!translations.has(`${isIncome ? Prefix.Income : Prefix.Expense}${categoryId}`)) {
        translations.set(`${isIncome ? Prefix.Income : Prefix.Expense}${categoryId}`, categoryName);
      }

      if (temp.has(mapKey)) {
        const currValue = temp.get(mapKey)!;
        const targetMap = currValue[isIncome ? 'income' : 'expense'];
        const nonTargetMap = currValue[isIncome ? 'expense' : 'income'];

        if (targetMap.has(categoryId)) {
          const currSum = targetMap.get(categoryId) ?? 0;
          targetMap.set(categoryId, currSum + absTransAmnt);
        } else targetMap.set(categoryId, absTransAmnt);

        temp.set(mapKey, {
          income: isIncome ? targetMap : nonTargetMap,
          expense: isIncome ? nonTargetMap : targetMap,
        });
      } else {
        temp.set(mapKey, {
          income: new Map<string, number>(isIncome ? [[categoryId, absTransAmnt]] : []),
          expense: new Map<string, number>(isIncome ? [] : [[categoryId, absTransAmnt]]),
        });
      }
    }

    return {
      series: Array.from(translations).map(([key, value]) => ({
        dataKey: key,
        label: value,
        stack: key.startsWith(Prefix.Income) ? 'income' : 'expense',
        valueFormatter: (v: number | null) => (v ? Formatter.formatBalance(v) : '-'),
      })),
      data: Array.from(temp).map(
        ([key, value]) =>
          ({
            date: new Date(`${key}-01`),
            ...Object.fromEntries(
              Array.from(value.income).map(([id, sum]) => {
                return [`${Prefix.Income}${id}`, sum];
              }),
            ),
            ...Object.fromEntries(
              Array.from(value.expense).map(([id, sum]) => {
                return [`${Prefix.Expense}${id}`, sum];
              }),
            ),
          }) as TChartData['data'][0],
      ),
    };
  }, [transactions]);

  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Income & Expenses</Card.Title>
          <Card.Subtitle>Grouped by month</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        {isLoadingTransactions ? (
          <CircularProgress />
        ) : (
          <BarChart
            dataset={ChartData.data}
            series={ChartData.series}
            {...{
              layout: screenSize === 'small' ? 'horizontal' : 'vertical',
              [screenSize === 'small' ? 'yAxis' : 'xAxis']: [
                {
                  scaleType: 'band',
                  dataKey: 'date',
                  valueFormatter: (v: Date) => format(v, 'MMM yyyy'),
                },
              ],
              [screenSize === 'small' ? 'xAxis' : 'yAxis']: [
                {valueFormatter: (value: string) => Formatter.formatBalance(Number(value))},
              ],
            }}
            tooltip={{trigger: 'item'}}
            slotProps={{legend: {hidden: true}}}
            margin={{left: 8 * (screenSize === 'small' ? 8 : 10), right: 0, top: 8 * 4, bottom: 8 * 3}}
            height={screenSize === 'small' ? 300 : 400}
          />
        )}
      </Card.Body>
    </Card>
  );
};
