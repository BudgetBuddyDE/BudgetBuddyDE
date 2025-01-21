import {type TAssetWatchlistWithQuote} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';
import {logger} from '@/logger';

import {StockService} from '../StockService/Stock.service';

export const useStockWatchlistStore = GenerateGenericStore<TAssetWatchlistWithQuote[]>(async () => {
  const [assets, error] = await StockService.getWatchlist();
  if (error) logger.error("Couldn't retrieve the asset watchlist", error);
  return assets ?? [];
});
