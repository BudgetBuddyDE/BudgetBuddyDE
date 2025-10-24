'use client';

import React from 'react';
import { type TAsset } from '@/types';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { ExpandMoreRounded } from '@mui/icons-material';
import { useScreenSize } from '@/hooks/useScreenSize';
import { BarChart } from '@/components/Charts';
import { Formatter } from '@/utils/Formatter';

export type DividendAccordionProps = {
  data: NonNullable<TAsset['dividends']['yearlyTTM']>;
  currency: string;
};
export const DividendAccordion: React.FC<DividendAccordionProps> = ({ data, currency }) => {
  const screenSize = useScreenSize();
  return (
    <Accordion disabled={!data.length}>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography component="span">Historical Dividends</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <BarChart
          dataset={screenSize === 'small' ? data.reverse() : data}
          series={[
            {
              dataKey: 'dividend',
              label: `Dividend`,
              valueFormatter: (v: number | null) =>
                Formatter.currency.formatBalance(v ?? 0, currency),
            },
          ]}
          {...{
            layout: screenSize === 'small' ? 'horizontal' : 'vertical',
            hideLegend: true,
            [screenSize === 'small' ? 'yAxis' : 'xAxis']: [
              {
                scaleType: 'band',
                dataKey: 'year',
                valueFormatter: (year: string) => new Date(year).getFullYear().toString(),
              },
            ],
            [screenSize === 'small' ? 'xAxis' : 'yAxis']: [
              {
                valueFormatter: (value: string) => Formatter.currency.formatBalance(Number(value)),
                width: 60,
              },
            ],
          }}
          sx={{
            '.MuiBarElement-root:hover': {
              cursor: 'pointer',
            },
          }}
          margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
          height={screenSize === 'small' ? data.length * 30 : 300}
          grid={{ [screenSize === 'small' ? 'vertical' : 'horizontal']: true }}
        />
      </AccordionDetails>
    </Accordion>
  );
};
