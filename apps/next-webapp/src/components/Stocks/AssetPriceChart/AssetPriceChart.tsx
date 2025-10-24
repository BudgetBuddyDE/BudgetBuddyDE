'use client';

import { Card } from '@/components/Card';
import { AreaGradient, LineChart } from '@/components/Charts';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useFetch } from '@/hooks/useFetch';
import { useScreenSize } from '@/hooks/useScreenSize';
import { logger } from '@/logger';
import { AssetService } from '@/services/Stock';
import { AssetIdentifier } from '@/types/Stocks/Parqet';
import { Formatter } from '@/utils/Formatter';
import { Stack, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import { isSameYear } from 'date-fns';
import React from 'react';
import { z } from 'zod';
import { CircularProgress } from '@/components/Loading';

export const TimeframeOptions = ['1w', '1m', '3m', '6m', 'ytd', '1y', '3y', '5y', 'max'];
export const Timeframe = z.enum(['1w', '1m', '3m', '6m', 'ytd', '1y', '3y', '5y', 'max']);
export type TTimeframe = z.infer<typeof Timeframe>;

export type AssetPriceChartProps = {
  assetName: string;
  currency: string;
  identifier: z.infer<typeof AssetIdentifier>;
};

export const AssetPriceChart: React.FC<AssetPriceChartProps> = ({
  assetName,
  currency,
  identifier,
}) => {
  const theme = useTheme();
  const screenSize = useScreenSize();
  const [timeframe, setTimeframe] = React.useState<TTimeframe>('3m');
  const fetchFunc = React.useCallback(async () => {
    logger.debug(
      `Fetching price chart data for ${identifier} with timeframe ${timeframe} and currency ${currency}`
    );
    const [quotes, err] = await AssetService.positions.getAssetQuotes(
      identifier,
      timeframe,
      currency
    );
    if (err) throw err;
    return quotes;
  }, [identifier, timeframe, currency]);
  const { isLoading, error, data, hasFetchedData } = useFetch(fetchFunc);

  const latestQuote: number = React.useMemo(() => {
    if (!data) return 0;
    const quote = data.quotes[data.quotes.length - 1];
    return quote?.price || 0;
  }, [data]);

  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    newTimeframe: any
  ) => {
    logger.debug(`Timeframe changed from %s to %s`, timeframe, newTimeframe);
    setTimeframe(newTimeframe);
  };

  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2 }}>
        <Stack>
          <Typography variant="subtitle1" fontWeight={'bold'}>
            {assetName}
          </Typography>
          <Typography variant="subtitle2" fontWeight={'bold'}>
            {Formatter.currency.formatBalance(latestQuote, currency)}
          </Typography>
        </Stack>

        <Card.HeaderActions>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={timeframe}
            onChange={handleTimeframeChange}
            exclusive
            aria-label="Select timeframe"
            disabled={isLoading}
          >
            {TimeframeOptions.map((option) => (
              <ToggleButton key={option} value={option}>
                {option}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Card.HeaderActions>
      </Card.Header>
      <Card.Body>
        {(!isLoading || hasFetchedData) && data ? (
          <LineChart
            skipAnimation
            colors={[theme.palette.primary.main]}
            series={[
              {
                id: 'price',
                yAxisId: 'priceAxis',
                label: assetName,
                curve: 'catmullRom',
                area: true,
                showMark: false,
                data: data.quotes.map(({ price }) => price),
                valueFormatter: (value) => Formatter.currency.formatBalance(value ?? 0),
                baseline: 'min',
              },
            ]}
            xAxis={[
              {
                scaleType: 'point',
                data: data.quotes.map(({ date }) => date),
                valueFormatter: (value: string) => {
                  const d = new Date(value);
                  return isSameYear(new Date(), d)
                    ? Formatter.date.formatWithPattern(d, 'MMM dd')
                    : Formatter.date.formatWithPattern(d, 'MMM dd, yy');
                },
                tickInterval: (_, i) =>
                  (i + 1) % Math.ceil(data.quotes.length / (data.quotes.length * 0.18)) === 0,
              },
            ]}
            yAxis={[
              {
                id: 'priceAxis',
                scaleType: 'linear',
                position: 'right',
                width: 70,
                valueFormatter: (value: string) => Formatter.currency.formatBalance(Number(value)),
                max: Math.max(...data.quotes.map(({ price }) => price)) * 1.025,
              },
            ]}
            height={screenSize === 'small' ? 250 : 400}
            margin={{ left: 0, right: 0, top: 0, bottom: 20 }}
            grid={{ horizontal: true }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2.5,
              },
              '& .MuiAreaElement-series-price': {
                fill: "url('#price')",
              },
            }}
            hideLegend
          >
            <AreaGradient color={theme.palette.primary.main} id="price" />
          </LineChart>
        ) : (
          <CircularProgress />
        )}
      </Card.Body>
      {error !== null && (
        <Card.Footer sx={{ p: 2 }}>
          <ErrorAlert error={error} />
        </Card.Footer>
      )}
    </Card>
  );
};
