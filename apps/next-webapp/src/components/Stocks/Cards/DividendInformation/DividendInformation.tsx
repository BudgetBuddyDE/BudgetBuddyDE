import React from 'react';
import { Card } from '@/components/Card';
import { NotNullable, type TAsset } from '@/types';
import { ExpandMoreRounded } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { Formatter } from '@/utils/Formatter';

export type DividendInformationProps = Pick<
  TAsset['dividends'],
  'historical' | 'future' | 'KPIs' | 'yearlyTTM' | 'payoutInterval'
>;

export const DividendInformation: React.FC<DividendInformationProps> = ({
  KPIs,
  future,
  yearlyTTM,
}) => {
  const kpiEntries = Object.entries(KPIs ?? {}).map(([key, value]) => ({ key, value: value ?? 0 }));
  const KpiLabels: Record<
    keyof NotNullable<DividendInformationProps['KPIs']>,
    { label: string; formatting: 'currency' | 'percentage' }
  > = {
    cagr10Y: { label: 'CAGR 10 Years', formatting: 'percentage' },
    cagr5Y: { label: 'CAGR 5 Years', formatting: 'percentage' },
    cagr3Y: { label: 'CAGR 3 Years', formatting: 'percentage' },
    dividendPerShareTTM: { label: 'Dividend Per Share TTM', formatting: 'currency' },
    dividendYieldPercentageTTM: {
      label: 'Dividend Yield Percentage TTM',
      formatting: 'percentage',
    },
  };
  return (
    <Card>
      <Card.Header>
        <Box>
          <Card.Title>Dividend Information</Card.Title>
          <Card.Subtitle>Details about the asset's dividends</Card.Subtitle>
        </Box>
      </Card.Header>
      <Card.Body>
        <Accordion disabled={!kpiEntries.length}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography component="span">KPIs</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <List dense disablePadding sx={{ py: 0 }}>
              {kpiEntries.map(({ key, value }, idx, arr) => {
                const { label, formatting } = KpiLabels[key as keyof typeof KpiLabels];
                return (
                  <React.Fragment key={key}>
                    <ListItem
                      secondaryAction={
                        <Typography>
                          {formatting === 'currency'
                            ? Formatter.currency.formatBalance(value)
                            : Formatter.percentage.format(value)}
                        </Typography>
                      }
                    >
                      <ListItemText primary={<Typography>{label}</Typography>} />
                    </ListItem>
                    {idx + 1 !== arr.length && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
        <Accordion disabled={!future.length}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography component="span">Upcoming Dividends</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <List dense disablePadding sx={{ py: 0 }}>
              {future.map(({ exDate, price, paymentDate, currency, isEstimated }, idx, arr) => {
                return (
                  <React.Fragment key={exDate.toString()}>
                    <ListItem
                      secondaryAction={
                        <Typography>
                          {isEstimated ? '~' : ''}
                          {Formatter.currency.formatBalance(price, currency)}
                        </Typography>
                      }
                    >
                      <ListItemText
                        primary={
                          <Stack>
                            <Typography>
                              {'Ex-Date: ' + Formatter.date.format(exDate, true)}
                            </Typography>
                            <Typography>
                              {'Fullfillment: ' + Formatter.date.format(paymentDate, true)}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                    {idx + 1 !== arr.length && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
        <Accordion disabled={!yearlyTTM || !yearlyTTM.length}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography component="span">Yearly Dividends</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <List dense disablePadding sx={{ py: 0 }}>
              {yearlyTTM?.reverse().map(({ year, dividend }, idx, arr) => (
                <React.Fragment key={year}>
                  <ListItem
                    key={year}
                    secondaryAction={
                      <Typography>{Formatter.currency.formatBalance(dividend)}</Typography>
                    }
                  >
                    <ListItemText primary={<Typography>{year}</Typography>} />
                  </ListItem>
                  {idx + 1 !== arr.length && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Card.Body>
    </Card>
  );
};
