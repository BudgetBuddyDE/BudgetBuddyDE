import {type TAssetSearchResult} from '@budgetbuddyde/types';
import {AddRounded, SearchRounded, StarBorderRounded, StarRounded} from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  type DialogProps,
  Grid2 as Grid,
  IconButton,
  CircularProgress as MuiCircularProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {debounce} from 'lodash';
import React from 'react';

import {ActionPaper} from '@/components/Base/ActionPaper';
import {Image} from '@/components/Base/Image';
import {CircularProgress} from '@/components/Loading';
import {useSnackbarContext} from '@/features/Snackbar';

import {StockService} from '../StockService';
import {useStockWatchlist} from '../StockWatchlist';

/**
 * Props for the SearchStockDialog component.
 */
export type TSearchStockDialogProps = {
  /**
   * Callback function triggered when an asset is selected.
   * @param asset The selected asset.
   */
  onSelectAsset?: (asset: TAssetSearchResult) => void;

  /**
   * Callback function triggered when opening a position for an asset.
   * @param asset The asset for which the position is being opened.
   */
  onOpenPosition?: (asset: TAssetSearchResult) => void;

  /**
   * Callback function triggered when interacting with the watchlist.
   * @param event The type of watchlist interaction ('ADD_TO_WATCHLIST' or 'REMOVE_FROM_WATCHLIST').
   * @param asset The asset being added to or removed from the watchlist.
   */
  onWatchlistInteraction?: (event: 'ADD_TO_WATCHLIST' | 'REMOVE_FROM_WATCHLIST', asset: TAssetSearchResult) => void;
} & DialogProps;

/**
 * SearchStockDialog component displays a dialog for searching and selecting stocks.
 *
 * @component
 * @example
 * return (
 *   <SearchStockDialog
 *     onSelectAsset={handleSelectAsset}
 *     onOpenPosition={handleOpenPosition}
 *     onWatchlistInteraction={handleWatchlistInteraction}
 *     // ...other props
 *   />
 * );
 */
export const SearchStockDialog: React.FC<TSearchStockDialogProps> = ({
  onSelectAsset,
  onOpenPosition,
  onWatchlistInteraction,
  ...dialogProps
}) => {
  const {showSnackbar} = useSnackbarContext();
  const {isLoading: isLoadingWatchlist, data: watchedAssets} = useStockWatchlist();
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<TAssetSearchResult[]>([]);

  const isStockWatched = React.useCallback(
    (isin: string): boolean => {
      return (watchedAssets ?? []).some(watched => watched.isin === isin);
    },
    [watchedAssets],
  );

  const searchStocks = async () => {
    if (searchTerm.length < 1) return setSearchResults([]);
    setLoading(true);
    try {
      const [matches, error] = await StockService.searchAsset(searchTerm);
      if (error) throw error;
      if (!matches) return setSearchResults([]);
      setSearchResults(matches);
    } catch (err) {
      console.error(err);
      showSnackbar({message: 'Error fetching stocks'});
    }
    setLoading(false);
  };

  React.useEffect(() => {
    searchStocks();
  }, [searchTerm]);

  return (
    <Dialog
      fullWidth
      scroll={'paper'}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
        },
      }}
      PaperProps={{elevation: 0, sx: {mt: theme => theme.spacing(30)}}}
      {...dialogProps}>
      <Box sx={{p: 2}}>
        <TextField
          type="search"
          placeholder="Search stock"
          onChange={debounce(e => setSearchTerm(e.target.value), 500)}
          fullWidth
          inputRef={input => input && input.focus()}
          slotProps={{
            input: {
              startAdornment: <SearchRounded sx={{mr: 1}} />,
              endAdornment: loading && <MuiCircularProgress size={26} />,
            },
          }}
        />
      </Box>
      {loading && isLoadingWatchlist && searchResults.length === 0 ? (
        <CircularProgress />
      ) : searchResults.length > 0 ? (
        <DialogContent sx={{maxHeight: theme => theme.spacing(40), p: 2}} dividers>
          {searchResults.map(asset => {
            const isWatched = isStockWatched(asset.identifier);
            return (
              <Grid
                key={asset.identifier}
                container
                alignItems="center"
                sx={{
                  mb: 1,
                  borderRadius: theme => theme.shape.borderRadius + 'px',
                  ':hover': onSelectAsset && {
                    backgroundColor: theme => theme.palette.action.hover,
                    cursor: 'pointer',
                  },
                }}
                onClick={() => onSelectAsset && onSelectAsset(asset)}>
                <Grid sx={{display: 'flex', width: '56px'}}>
                  <ActionPaper sx={{width: '56px', height: '56px'}}>
                    <Image src={asset.logo} alt={asset.name + ' logo'} sx={{width: 'inherit', height: 'inherit'}} />
                  </ActionPaper>
                </Grid>
                <Grid sx={{flex: 1, wordWrap: 'break-word', pl: 1}}>
                  <Typography variant="body1" fontWeight={'bolder'}>
                    {asset.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {asset.type} - {asset.identifier}
                  </Typography>
                </Grid>
                {onOpenPosition && (
                  <Grid>
                    <Tooltip title="Open position">
                      <IconButton
                        size="large"
                        color="primary"
                        onClick={event => {
                          event.stopPropagation();
                          onOpenPosition(asset);
                        }}>
                        <AddRounded />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
                {onWatchlistInteraction && (
                  <Grid>
                    <Tooltip title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}>
                      <IconButton
                        size="large"
                        color="primary"
                        onClick={event => {
                          event.stopPropagation();
                          onWatchlistInteraction(isWatched ? 'REMOVE_FROM_WATCHLIST' : 'ADD_TO_WATCHLIST', asset);
                        }}>
                        {isWatched ? <StarRounded /> : <StarBorderRounded />}
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            );
          })}
        </DialogContent>
      ) : (
        searchTerm.length > 0 && (
          <ActionPaper sx={{m: 2, mt: 0, p: 2}}>
            <Typography variant={'body1'} textAlign={'center'}>
              No results for '{searchTerm}'!
            </Typography>
          </ActionPaper>
        )
      )}
    </Dialog>
  );
};
