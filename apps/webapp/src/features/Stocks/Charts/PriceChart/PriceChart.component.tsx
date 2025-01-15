import {type TTimeframe} from '@budgetbuddyde/types';
import {Chip, Stack, Typography, useTheme} from '@mui/material';
import {format, isSameYear} from 'date-fns';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {AreaGradient, LineChart} from '@/components/Base/Charts';
import {Timeframe} from '@/components/Timeframe';
import {useScreenSize} from '@/hooks/useScreenSize';
import {Formatter} from '@/services/Formatter';

export type TPriceChartPoint = {
  date: Date | string;
  price: number;
};

export type TPriceChartProps = {
  onTimeframeChange?: (timeframe: TTimeframe) => void;
  data: TPriceChartPoint[];
  company: {name: string};
};

export const PriceChart: React.FC<TPriceChartProps> = ({onTimeframeChange, company, data}) => {
  const theme = useTheme();
  const screenSize = useScreenSize();

  const oldestPrice = data.at(0)!.price;
  const latestPrice = data.at(-1)!.price;
  const priceDiff = latestPrice - oldestPrice;

  return (
    <Card sx={{p: 0}}>
      <Card.Header sx={{px: 2, pt: 2}}>
        <Stack>
          <Typography variant="h6">{company.name}</Typography>
          <Stack sx={{justifyContent: 'space-between'}}>
            <Stack
              direction="row"
              sx={{
                alignContent: {xs: 'center', sm: 'flex-start'},
                alignItems: 'center',
                gap: 1,
              }}>
              <Typography variant="h4" component="p">
                {Formatter.formatBalance(latestPrice)}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color={latestPrice > oldestPrice ? 'success' : 'error'}
                label={`${((priceDiff * 100) / oldestPrice).toDecimal(2)}% (${Formatter.formatBalance(priceDiff)})`}
              />
            </Stack>
            <Typography variant="caption" sx={{color: 'text.secondary'}}>
              Stock price per day for {company.name}
            </Typography>
          </Stack>
        </Stack>

        <Card.HeaderActions
          sx={{
            display: 'flex',
            flexDirection: 'row',
          }}>
          {onTimeframeChange && <Timeframe onChange={onTimeframeChange} />}
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        <LineChart
          skipAnimation
          colors={[theme.palette.primary.main]}
          xAxis={[
            {
              scaleType: 'point',
              data: data.map(({date}) => format(new Date(date), 'yyyy-MM-dd')),
              valueFormatter: (value: string) => {
                const d = new Date(value);
                return isSameYear(new Date(), d) ? format(d, 'MMM dd') : format(d, 'MMM dd, yy');
              },
              tickInterval: (_, i) => (i + 1) % Math.ceil(data.length / (data.length * 0.18)) === 0,
            },
          ]}
          yAxis={[
            {
              id: 'priceAxis',
              scaleType: 'linear',
              disableTicks: true,
              tickLabelStyle: {
                transform: 'translate(-30px)',
                textAnchor: 'middle',
              },
              valueFormatter: (value: string) => Formatter.formatBalance(Number(value)),
              max: Math.max(...data.map(({price}) => price)) * 1.025,
            },
          ]}
          rightAxis="priceAxis"
          leftAxis={null}
          series={[
            {
              id: 'price',
              yAxisId: 'priceAxis',
              label: company.name,
              showMark: false,
              curve: 'catmullRom',
              area: true,
              data: data.map(({price}) => price),
              valueFormatter: value => Formatter.formatBalance(value ?? 0),
              baseline: 'min',
            },
          ]}
          height={screenSize === 'small' ? 250 : 400}
          margin={{left: 0, right: -1, top: 20, bottom: 30}}
          grid={{horizontal: true}}
          sx={{
            '& .MuiLineElement-root': {
              strokeWidth: 2.5,
            },
            '& .MuiAreaElement-series-price': {
              fill: "url('#price')",
            },
          }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}>
          <AreaGradient color={theme.palette.primary.main} id="price" />
        </LineChart>
      </Card.Body>
    </Card>
  );
};
