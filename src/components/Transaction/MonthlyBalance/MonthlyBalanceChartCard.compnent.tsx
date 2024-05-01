import {type TMonthlyBalance} from '@budgetbuddyde/types';
import {Box, Paper, Skeleton, Typography, useTheme} from '@mui/material';
import {format, isSameYear} from 'date-fns';
import React from 'react';
import ApexChart from 'react-apexcharts';

import {Card} from '@/components/Base';
import {useScreenSize} from '@/hooks';
import {Formatter} from '@/services';
import {formatBalance} from '@/utils';

import {useFetchMonthlyBalance} from './useFetchMonthlyBalance.hook';

export type TMonthlyBalanceChartCardProps = {};

export const MonthlyBalanceChartCard: React.FC<TMonthlyBalanceChartCardProps> = () => {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const {loading, balances} = useFetchMonthlyBalance();
  const [selectedBarGroup, setSelectedBarGroup] = React.useState<TMonthlyBalance | null>(null);

  const relevantBalances: TMonthlyBalance[] = React.useMemo(() => {
    return balances.slice(0, screenSize === 'small' ? 6 : 11);
  }, [balances, screenSize]);

  const handler = {
    formatMonth(date: Date | string) {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return `${Formatter.formatDate().shortMonthName(dateObj)} ${isSameYear(dateObj, new Date()) ? '' : format(dateObj, 'yy')}`;
    },
  };

  React.useEffect(() => {
    setSelectedBarGroup(balances[0]);
    return () => {
      setSelectedBarGroup(null);
    };
  }, [balances]);

  return (
    <Card sx={{mt: 2}}>
      <Card.Header>
        <Box>
          <Card.Title>Monthly Balance</Card.Title>
          <Card.Subtitle>Your monthly balance for the past {balances.length} months</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Paper elevation={0} sx={{mt: '1rem'}}>
          {!loading && selectedBarGroup && (
            <Box sx={{ml: 2, mt: 1}}>
              <Typography variant="caption">{handler.formatMonth(selectedBarGroup.date)}</Typography>
              <Typography variant="subtitle1">{Formatter.formatBalance(selectedBarGroup.balance)}</Typography>
            </Box>
          )}

          {loading ? (
            <Skeleton variant="rounded" width={'100%'} height={300} />
          ) : (
            <ApexChart
              width={'100%'}
              height={screenSize === 'small' ? 200 : screenSize === 'medium' ? 250 : 300}
              type="bar"
              options={{
                chart: {
                  type: 'bar',
                  zoom: {enabled: false},
                  toolbar: {show: false},
                  // events: {
                  //   dataPointMouseEnter(e, chart, options) {
                  //     console.log(e, chart, options);
                  //   },
                  //   dataPointMouseLeave(e, chart, options) {
                  //     console.log(e, chart, options);
                  //   },
                  // },
                },
                legend: {show: false},
                yaxis: {show: false},
                grid: {show: false, padding: {left: -12, right: -4, top: -20, bottom: 0}},
                xaxis: {
                  type: 'datetime',
                  axisBorder: {show: false},
                  labels: {
                    datetimeFormatter: {
                      year: 'yyyy',
                      month: 'MMM yy',
                    },
                    style: {
                      colors: theme.palette.text.primary,
                    },
                  },
                  crosshairs: {show: false},
                },
                dataLabels: {enabled: false},
                plotOptions: {
                  bar: {
                    borderRadius: Math.round(theme.shape.borderRadius / 2.5),
                  },
                },
                tooltip: {
                  theme: 'dark',
                  x: {
                    formatter(val) {
                      return handler.formatMonth(new Date(val));
                    },
                  },
                  y: {
                    formatter(val) {
                      return formatBalance(val as number);
                    },
                  },
                },
              }}
              series={[
                {
                  name: 'Income',
                  data: relevantBalances.map(({date, income}) => [date.getTime(), income]),
                  color: theme.palette.success.main,
                },
                {
                  name: 'Expenses',
                  data: relevantBalances.map(({date, expenses}) => [date.getTime(), expenses]),
                  color: theme.palette.error.main,
                },
              ]}
            />
          )}
        </Paper>
      </Card.Body>
    </Card>
  );
};
