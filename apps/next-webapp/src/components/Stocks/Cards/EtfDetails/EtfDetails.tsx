'use client';

import React from 'react';
import { type TAsset } from '@/types';
import { Card } from '@/components/Card';
import { Alert, Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';
import { ReadMoreText } from '@/components/ReadMoreText';
import { Formatter } from '@/utils/Formatter';
import { PieChart } from '@/components/Charts';

export type EtfDetailsProps = {
  details: NonNullable<TAsset['etfDetails']>;
};

export const EtfDetails: React.FC<EtfDetailsProps> = ({
  details: {
    description,
    aum,
    breakdown,
    expenseRatio,
    nav,
    priceToBook,
    priceToEarnings,
    currency,
  },
}) => {
  const KPIs = [
    { label: 'AUM', value: Formatter.currency.shortenNumber(aum) + ' ' + currency },
    { label: 'Expense Ratio', value: expenseRatio },
    { label: 'NAV', value: nav },
    { label: 'Price to Book', value: priceToBook },
    { label: 'Price to Earnings', value: priceToEarnings },
  ];

  return (
    <Card sx={{ p: 0 }}>
      <Card.Header sx={{ px: 2, pt: 2, mb: 0 }}>
        <Box>
          <Card.Title>ETF Details</Card.Title>
          <Card.Subtitle>Information about the ETF</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Box sx={{ px: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Description
          </Typography>
          <ReadMoreText text={description} />
        </Box>
        <Divider sx={{ mt: 1 }} />
        <List dense disablePadding sx={{ py: 0 }}>
          {KPIs.map(({ label, value }, idx, arr) => (
            <React.Fragment key={label}>
              <ListItem secondaryAction={<Typography>{value}</Typography>}>
                <ListItemText primary={<Typography>{label}</Typography>} />
              </ListItem>
              {idx + 1 !== arr.length && <Divider />}
            </React.Fragment>
          ))}
        </List>
        <Divider sx={{ mb: 1 }} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Holdings
          </Typography>

          <PieChart
            fullWidth
            primaryText={
              breakdown.holdings.reduce((acc, holding) => acc + holding.share, 0).toFixed(2) + '%'
            }
            secondaryText="of total holdings"
            series={[
              {
                data: breakdown.holdings.map((holding) => ({
                  label: holding.name,
                  value: holding.marketValue,
                })),
                valueFormatter: (value) => Formatter.currency.shortenNumber(value.value),
              },
            ]}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            ETF holdings as of {Formatter.date.format(breakdown.updatedAt)}.
          </Alert>
        </Box>
      </Card.Body>
    </Card>
  );
};
