import {ExpandMoreRounded, MoneyOffRounded} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Button, Typography} from '@mui/material';
import {ChartsAxisData} from '@mui/x-charts';
import React from 'react';

import {BarChart} from '@/components/Base/Charts';
import {NoResults} from '@/components/NoResults';
import {StockService} from '@/features/Stocks/StockService';
import {useScreenSize} from '@/hooks/useScreenSize';
import {Formatter} from '@/services/Formatter';

import {HistoricalDividendsDrawer} from '../Drawer';

export type THistoricalDividendsAccordionProps = {
  stockDetails: Awaited<ReturnType<typeof StockService.getAssetDetails>>[0];
};

export const HistoricalDividendsAccordion: React.FC<THistoricalDividendsAccordionProps> = ({stockDetails}) => {
  const [showDividendDrawer, setShowDividendDrawer] = React.useState(false);
  const screenSize = useScreenSize();

  const currency = React.useMemo(() => stockDetails?.details.securityDetails?.currency, [stockDetails]);

  const chartData = React.useMemo(() => {
    if (!stockDetails || !stockDetails.details.historicalDividends) return [];

    let data = {} as Record<string, number>;
    for (const {date, price} of stockDetails.details.historicalDividends) {
      const year = date.getFullYear();
      if (!data[year]) data[year] = 0;
      data[year] += price;
    }

    return Object.entries(data).map(([year, total]) => ({
      year: new Date(Number(year), 0),
      total,
    }));
  }, [stockDetails]);

  const handler = {
    onCloseDividendDrawer: () => {
      setShowDividendDrawer(false);
    },
    onAxisClick: (_event: MouseEvent, _data: null | ChartsAxisData) => {
      setShowDividendDrawer(true);
    },
    onViewDetailsClick: () => {
      setShowDividendDrawer(true);
    },
  };

  return (
    <React.Fragment>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
          <Typography variant="subtitle1" fontWeight={'bold'}>
            Historical Dividends
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{px: 0}}>
          <Button
            onClick={handler.onViewDetailsClick}
            variant="text"
            color="primary"
            sx={{mx: 2, display: {md: 'none'}}}
            fullWidth>
            View Details
          </Button>

          {chartData.length > 0 ? (
            <BarChart
              dataset={screenSize === 'small' ? chartData.reverse() : chartData}
              series={[
                {
                  dataKey: 'total',
                  label: `Dividend (${currency})`,
                  valueFormatter: (v: number | null) => Formatter.formatBalance(v ?? 0, currency),
                },
              ]}
              {...{
                layout: screenSize === 'small' ? 'horizontal' : 'vertical',
                [screenSize === 'small' ? 'yAxis' : 'xAxis']: [
                  {
                    scaleType: 'band',
                    dataKey: 'year',
                    valueFormatter: (v: Date) => v.getFullYear().toString(),
                  },
                ],
                [screenSize === 'small' ? 'xAxis' : 'yAxis']: [
                  {valueFormatter: (value: string) => Formatter.formatBalance(Number(value))},
                ],
              }}
              sx={{
                '.MuiBarElement-root:hover': {
                  cursor: 'pointer',
                },
              }}
              onAxisClick={handler.onAxisClick}
              height={screenSize === 'small' ? chartData.length * 30 : 300}
              grid={{[screenSize === 'small' ? 'vertical' : 'horizontal']: true}}
              margin={{left: screenSize === 'small' ? 50 : 80, right: 20, top: 20, bottom: 20}}
            />
          ) : (
            <NoResults icon={<MoneyOffRounded />} text="This company has not paid any dividends yet." sx={{mx: 2}} />
          )}
        </AccordionDetails>
      </Accordion>

      <HistoricalDividendsDrawer
        open={showDividendDrawer}
        onClose={handler.onCloseDividendDrawer}
        stockDetails={stockDetails}
      />
    </React.Fragment>
  );
};
