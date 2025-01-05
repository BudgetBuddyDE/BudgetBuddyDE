import {ExpandMoreRounded, MoneyOffRounded} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Typography} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {BarChart} from '@/components/Base/Charts';
import {NoResults} from '@/components/NoResults';
import {StockService} from '@/features/Stocks/StockService';
import {useScreenSize} from '@/hooks/useScreenSize';
import {Formatter} from '@/services/Formatter';

export type THistoricalDividendsProps = {
  stockDetails: Awaited<ReturnType<typeof StockService.getAssetDetails>>[0];
};

export const HistoricalDividends: React.FC<THistoricalDividendsProps> = ({stockDetails}) => {
  const screenSize = useScreenSize();

  const currency = React.useMemo(() => stockDetails?.details.securityDetails?.currency, [stockDetails]);

  const chartData = React.useMemo(() => {
    if (!stockDetails) return [];
    return (stockDetails.details.historicalDividends ?? []).map(({date, price}) => ({date, price}));
  }, [stockDetails]);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography variant="subtitle1" fontWeight={'bold'}>
          Historical Dividends
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 0}}>
        {chartData.length >= 0 ? (
          <BarChart
            dataset={screenSize === 'small' ? chartData : chartData.reverse()}
            series={[
              {
                dataKey: 'price',
                label: `Dividend (${currency})`,
                valueFormatter: (v: number | null) => Formatter.formatBalance(v ?? 0, currency),
              },
            ]}
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
            height={screenSize === 'small' ? chartData.length * 30 : 300}
            grid={{[screenSize === 'small' ? 'vertical' : 'horizontal']: true}}
            margin={{left: 80, right: 20, top: 20, bottom: 20}}
          />
        ) : (
          <NoResults icon={<MoneyOffRounded />} text="This company has not paid any dividends yet." sx={{mx: 2}} />
        )}
      </AccordionDetails>
    </Accordion>
  );
};
