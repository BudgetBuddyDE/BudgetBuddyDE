'use client';

import { ActionPaper } from '@/components/ActionPaper';
import { type FirstLevelNullable } from '@/components/Drawer';
import { type TExpandedStockPosition } from '@/types';
import { Grid, Popover, Stack, Typography } from '@mui/material';
import { Image } from '@/components/Image';

export type StockPopoverProps = FirstLevelNullable<{
  anchorElement: HTMLElement;
  securityDetails: Pick<
    TExpandedStockPosition,
    'logoUrl' | 'securityName' | 'toExchange' | 'purchasedAt' | 'isin' | 'assetType'
  >;
}> & { onClose: () => void };

export const StockPopover: React.FC<StockPopoverProps> = ({
  securityDetails,
  anchorElement,
  onClose,
}) => {
  const open = Boolean(anchorElement);
  if (!securityDetails) return null;
  const { logoUrl, securityName, toExchange, purchasedAt, isin, assetType } = securityDetails;
  return (
    <Popover
      id="mouse-over-popover"
      sx={{ pointerEvents: 'none' }}
      open={open}
      anchorEl={anchorElement}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      onClose={onClose}
      disableRestoreFocus
    >
      <Grid container sx={{ m: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Stack direction={'row'} alignItems="center">
            <ActionPaper
              sx={{
                minWidth: '40px',
                width: '56px',
                height: '56px',
                mr: 1.5,
              }}
            >
              <Image src={logoUrl} sx={{ width: 'inherit', height: 'inherit' }} />
            </ActionPaper>

            <Stack>
              <Typography variant="caption">
                {assetType} - {isin}
              </Typography>
              <Typography variant="body1" fontWeight={'bolder'}>
                {securityName}
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography>Bought at: </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography>Exchange: </Typography>
        </Grid>
      </Grid>
    </Popover>
  );
};
