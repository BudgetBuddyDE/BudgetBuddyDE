import React from 'react';
import { type TAsset } from '@/types';
import { Card } from '@/components/Card';
import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Formatter } from '@/utils/Formatter';
import { NoResults } from '@/components/NoResults';
import { ScoreRounded } from '@mui/icons-material';

export type AssetMetricsProps = Pick<
  TAsset,
  | 'beta'
  | 'currency'
  | 'dividendPerShareTTM'
  | 'dividendYieldPercentageTTM'
  | 'payoutRatioTTM'
  | 'marketCap'
  | 'peRatioTTM'
  | 'pegRatioTTM'
  | 'priceFairValueRatio'
  | 'priceSalesRatioTTM'
  | 'priceToBookRatioTTM'
  | 'fiftyTwoWeekRange'
>;

export const AssetMetrics: React.FC<AssetMetricsProps> = ({
  marketCap,
  dividendPerShareTTM,
  dividendYieldPercentageTTM,
  fiftyTwoWeekRange,
  currency,
  beta,
  payoutRatioTTM,
  peRatioTTM,
  pegRatioTTM,
  priceFairValueRatio,
  priceSalesRatioTTM,
  priceToBookRatioTTM,
}) => {
  const transformedData: {
    include: boolean;
    label: string;
    value: string | number;
    info?: string;
  }[] = React.useMemo(() => {
    return [
      {
        include: marketCap !== null,
        label: 'Market cap.',
        value: Formatter.currency.shortenNumber(marketCap ?? 0),
      },
      {
        include: fiftyTwoWeekRange !== null,
        label: '52-Week Range',
        value: `${Formatter.currency.formatBalance(
          fiftyTwoWeekRange?.from || 0,
          currency ?? undefined
        )} - ${Formatter.currency.formatBalance(
          fiftyTwoWeekRange?.to || 0,
          currency ?? undefined
        )}`,
      },
      {
        include: beta !== null,
        label: 'Beta',
        value: beta ?? 0,
      },
      {
        include: payoutRatioTTM !== null,
        label: 'Payout Ratio (TTM)',
        value: Formatter.percentage.format(payoutRatioTTM ?? 0),
      },
      {
        include: peRatioTTM !== null,
        label: 'P/E Ratio (TTM)',
        value: peRatioTTM ?? 0,
      },
      {
        include: pegRatioTTM !== null,
        label: 'PEG Ratio (TTM)',
        value: pegRatioTTM ?? 0,
      },
      {
        include: priceFairValueRatio !== null,
        label: 'Price to Fair Value Ratio',
        value: priceFairValueRatio ?? 0,
      },
      {
        include: priceSalesRatioTTM !== null,
        label: 'Price to Sales Ratio (TTM)',
        value: priceSalesRatioTTM ?? 0,
      },
      {
        include: priceToBookRatioTTM !== null,
        label: 'Price to Book Ratio (TTM)',
        value: priceToBookRatioTTM ?? 0,
      },

      {
        include: dividendPerShareTTM !== null,
        label: 'Dividend per share (TTM)',
        value: Formatter.currency.shortenNumber(dividendPerShareTTM ?? 0),
      },
      {
        include: dividendYieldPercentageTTM !== null,
        label: 'Dividend yield (TTM)',
        value: Formatter.percentage.format(dividendYieldPercentageTTM ?? 0),
      },
    ].filter((item) => item.include);
  }, []);

  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2 }}>
        <Box>
          <Card.Title>Metrics</Card.Title>
          <Card.Subtitle>Financial metrics about the asset</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        {transformedData.length > 0 ? (
          <List dense disablePadding sx={{ py: 0 }}>
            {transformedData.map(({ label, value, info }, idx, arr) => (
              <React.Fragment key={label.replaceAll(' ', '-').toLowerCase()}>
                <ListItem secondaryAction={<Typography>{value}</Typography>}>
                  <ListItemText primary={<Typography>{label}</Typography>} />
                </ListItem>
                {idx + 1 !== arr.length && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <NoResults
            icon={<ScoreRounded />}
            text="No financial metrics available"
            sx={{ m: 2, mb: 0 }}
          />
        )}
      </Card.Body>
    </Card>
  );
};
