import {CloseRounded} from '@mui/icons-material';
import {Box, Divider, Grid2 as Grid, IconButton, Stack, Tooltip, Typography} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {Drawer} from '@/components/Drawer';
import {StockService} from '@/features/Stocks/StockService';
import {Formatter} from '@/services/Formatter';

type TDrawerData = {
  year: number;
  dividends: {
    price: number;
    currency: string;
    exDate: Date;
    paymentDate: Date;
    declarationDate: null;
  }[];
};

export type THistoricalDividendsDrawerProps = {
  open: boolean;
  onClose: () => void;
  stockDetails: Awaited<ReturnType<typeof StockService.getAssetDetails>>[0];
};

export const HistoricalDividendsDrawer: React.FC<THistoricalDividendsDrawerProps> = ({open, onClose, stockDetails}) => {
  const data: TDrawerData[] = React.useMemo(() => {
    if (!stockDetails || !stockDetails.details.historicalDividends) return [];
    const groupedByYear: Record<number, TDrawerData> = {};
    for (const item of stockDetails.details.historicalDividends) {
      const year = new Date(item.date).getFullYear();
      if (!groupedByYear[year]) {
        groupedByYear[year] = {
          year,
          dividends: [],
        };
      }
      groupedByYear[year].dividends.push({
        price: item.price,
        currency: item.currency,
        exDate: new Date(item.exDate),
        paymentDate: new Date(item.paymentDate),
        declarationDate: null,
      });
    }
    return Object.values(groupedByYear).reverse();
  }, [stockDetails]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closeOnBackdropClick
      closeOnEscape
      PaperProps={{
        sx: {
          height: {xs: '75%', md: '100%'},
        },
      }}>
      <Box sx={{position: 'relative'}}>
        <Stack
          direction={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
          sx={{
            position: 'sticky',
            width: '100%',
            top: 0,
            p: 2,
            backgroundColor: theme => theme.palette.background.paper,
          }}>
          <Stack>
            <Typography variant="subtitle1" fontWeight="bold">
              Dividends
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              Historical payed dividends
            </Typography>
          </Stack>
          <ActionPaper>
            <IconButton color="primary">
              <CloseRounded onClick={onClose} />
            </IconButton>
          </ActionPaper>
        </Stack>

        <Stack flexDirection={'column'} sx={{px: 2, pb: 2}}>
          {data.map(({year, dividends}, idx, arr) => (
            <Box>
              <Typography variant="h6" mb={1}>
                {year}
              </Typography>
              <Grid container spacing={2}>
                {dividends.map(({price, currency, exDate, paymentDate}) => (
                  <Grid size={{xs: 12, md: 6}}>
                    <Stack flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                      <Tooltip
                        title={`Payment date: ${format(new Date(paymentDate), 'dd MMM yyyy')}`}
                        arrow
                        placement="top">
                        <Typography variant="body1">{format(new Date(exDate), 'dd MMM yyyy')}</Typography>
                      </Tooltip>
                      <Typography variant="body1">{Formatter.formatBalance(price, currency, 2, 6)}</Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
              {idx !== arr.length - 1 && <Divider sx={{my: 2}} />}
            </Box>
          ))}
        </Stack>
      </Box>
    </Drawer>
  );
};
