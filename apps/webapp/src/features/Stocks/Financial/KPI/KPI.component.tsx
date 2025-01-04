import {type TAssetDetails} from '@budgetbuddyde/types';
import {Box, Grid2 as Grid, Stack, Tooltip, Typography} from '@mui/material';
import React from 'react';

import {Card} from '@/components/Base/Card';
import {Formatter} from '@/services/Formatter';

export type TKPIProps = {
  stockDetails: TAssetDetails;
};

export const KPIComponent: React.FC<TKPIProps> = ({
  stockDetails: {
    details: {securityDetails},
  },
}) => {
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Financial Performance Overview</Card.Title>
          <Card.Subtitle>Key Metrics Highlighting Valuation, Dividends, and Growth Trends</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body sx={{pt: 1}}>
        {securityDetails ? (
          <Grid container columnSpacing={2}>
            {(
              [
                {label: '52w (low)', value: Formatter.formatBalance(securityDetails.fiftyTwoWeekRange.from)},
                {label: '52w (high)', value: Formatter.formatBalance(securityDetails.fiftyTwoWeekRange.to)},
                {
                  label: 'Dividend',
                  value: Formatter.formatBalance(securityDetails.dividendPerShareTTM ?? 0),
                  info: 'The amount of dividend paid per share.',
                },
                {
                  label: 'Dividend Yield',
                  value: `${securityDetails.dividendYielPercentageTTM ?? 0}%`,
                  info: 'Represents the annual dividend as a percentage of the stock price.',
                },
                {
                  label: 'Beta',
                  value: securityDetails.beta,
                  info: "Measures the stock's volatility compared to the market; higher than 1 indicates more risk and potential return.",
                },
                {
                  label: 'P/E TTM',
                  value: securityDetails.peRatioTTM,
                  info: 'Indicates how much investors are willing to pay per dollar of earnings.',
                },
                {
                  label: 'P/S TTM',
                  value: securityDetails.priceSalesRatioTTM,
                  info: 'Shows the price investors pay per dollar of revenue.',
                },
                {
                  label: 'P/B TTM',
                  value: securityDetails.priceToBookRatioTTM,
                  info: 'Compares market value to book value; a very low ratio indicates the stock is trading well below its intrinsic value.',
                },
                {
                  label: 'PEG TTM',
                  value: securityDetails.pegRatioTTM,
                  info: 'Evaluates price relative to earnings growth. Negative, signaling declining earnings and potential issues.',
                },
                {
                  label: 'Fair Value TTM',
                  value: securityDetails.priceFairValueTTM,
                  info: 'Indicates the stock is trading at X% of its fair value',
                },
                {
                  label: 'Payout Ratio',
                  value: securityDetails.payoutRatioTTM,
                  info: 'Shows the percentage of earnings paid as dividends.',
                },
                {label: 'Shares', value: Formatter.shortenNumber(securityDetails.shares)},
                {label: 'Market cap.', value: Formatter.shortenNumber(securityDetails.marketCap)},
              ] as {label: string; value: number | string; info?: string}[]
            ).map(({label, value, info}) => (
              <Grid size={{xs: 6, md: 3}}>
                <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                  <Tooltip title={info} placement="top" arrow>
                    <Typography variant="body1" fontWeight={'bolder'}>
                      {label}
                    </Typography>
                  </Tooltip>
                  <Typography variant="body2">{value}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1">No data available</Typography>
        )}
      </Card.Body>
    </Card>
  );
};
