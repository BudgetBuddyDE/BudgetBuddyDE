import {ZAddWatchlistAssetPayload, ZDeleteWatchlistAssetPayload} from '@budgetbuddyde/types';
import {Box, Grid2 as Grid} from '@mui/material';
import React from 'react';

import {useAuthContext} from '@/features/Auth';
import {useSnackbarContext} from '@/features/Snackbar';
import {useKeyPress} from '@/hooks/useKeyPress';

import {DataDisclaimer} from '../LiabilityDisclaimer/Disclaimer.component';
import {SearchStockDialog, type TSearchStockDialogProps} from '../SearchStockDialog';
import {useStockExchanges} from '../StockExchange';
import {StockService} from '../StockService/Stock.service';
import {useStockWatchlist, useStockWatchlistStore} from '../StockWatchlist';

/**
 * Props for the StockLayout component.
 */
export type TStockLayoutProps = React.PropsWithChildren<
  Pick<TSearchStockDialogProps, 'onSelectAsset' | 'onOpenPosition'>
>;

/**
 * StockLayout component is responsible for rendering the layout for stocks.
 * It provides a dialog for searching and selecting stocks, and handles user interactions.
 *
 * @component
 * @example
 * return (
 *   <StockLayout
 *     onSelectAsset={handleSelectAsset}
 *     onOpenPosition={handleOpenPosition}
 *     onWatchlistInteraction={handleWatchlistInteraction}
 *   >
 *     {children}
 *   </StockLayout>
 * );
 */
export const StockLayout: React.FC<TStockLayoutProps> = ({onSelectAsset, onOpenPosition, children}) => {
  const {sessionUser} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {set: setStockWatchlist} = useStockWatchlistStore();
  const {data: stockExchanges} = useStockExchanges();
  const {isLoading: isLoadingWatchlist, data: watchedAssets} = useStockWatchlist();
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const [showStockDialog, setShowStockDialog] = React.useState(false);

  useKeyPress(
    ['k'],
    event => {
      event.preventDefault();
      setShowStockDialog(true);
    },
    dialogRef.current,
    true,
  );

  return (
    <React.Fragment>
      {children}
      <SearchStockDialog
        ref={dialogRef}
        open={showStockDialog}
        onClose={() => setShowStockDialog(false)}
        onSelectAsset={
          onSelectAsset
            ? asset => {
                setShowStockDialog(false);
                onSelectAsset(asset);
              }
            : undefined
        }
        onOpenPosition={
          onOpenPosition
            ? asset => {
                setShowStockDialog(false);
                onOpenPosition(asset);
              }
            : undefined
        }
        onWatchlistInteraction={async (event, asset) => {
          setShowStockDialog(false);
          if (!sessionUser || isLoadingWatchlist || !stockExchanges) return;

          if (event === 'ADD_TO_WATCHLIST') {
            try {
              const langSchwarzExchange = stockExchanges.find(exchange => exchange.symbol === 'LSX');
              if (!langSchwarzExchange) {
                throw new Error('Lang & Schwarz exchange not found');
              }

              const parsedPayload = ZAddWatchlistAssetPayload.safeParse({
                owner: sessionUser?.id,
                isin: asset.identifier,
                exchange: langSchwarzExchange.id,
              });
              if (!parsedPayload.success) throw parsedPayload.error;
              const [result, err] = await StockService.addAssetToWatchlist(parsedPayload.data);
              if (err) throw err;
              if (!result) throw new Error('Error adding asset to watchlist');
              setStockWatchlist(result);
              showSnackbar({message: 'Asset added to watchlist'});
            } catch (error) {
              console.error(error);
              showSnackbar({message: 'Error adding asset to watchlist'});
            }
          } else if (event === 'REMOVE_FROM_WATCHLIST') {
            try {
              const langSchwarzExchange = stockExchanges.find(exchange => exchange.symbol === 'LSX');
              if (!langSchwarzExchange) {
                throw new Error('Lang & Schwarz exchange not found');
              }

              const watchlistItem = (watchedAssets ?? []).find(
                ({isin, exchange}) => isin === asset.identifier && exchange === langSchwarzExchange.id,
              );
              if (!watchlistItem) throw new Error("Asset isn't in watchlist");

              const parsedPayload = ZDeleteWatchlistAssetPayload.safeParse({id: watchlistItem.id});
              if (!parsedPayload.success) throw parsedPayload.error;
              const [result, err] = await StockService.deleteAssetFromWatchlist(parsedPayload.data);
              if (err) throw err;
              if (!result) throw new Error('Error removing asset from watchlist');
              setStockWatchlist((watchedAssets ?? []).filter(({id}) => id !== watchlistItem.id));
              showSnackbar({message: 'Asset removed from watchlist'});
            } catch (error) {
              console.error(error);
              showSnackbar({message: 'Error removing asset from watchlist'});
            }
          }
        }}
      />

      <Grid size={{xs: 12}}>
        <Box sx={{pt: 2}}>
          <DataDisclaimer />
        </Box>
      </Grid>
    </React.Fragment>
  );
};
