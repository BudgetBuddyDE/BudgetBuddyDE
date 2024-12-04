import {type TAssetWatchlistWithQuote} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';

import {StockService} from '../StockService/Stock.service';

export const useStockWatchlistStore = GenerateGenericStore<TAssetWatchlistWithQuote[]>(async () => {
  const [assets, error] = await StockService.getWatchlist();
  if (error) console.error(error);
  return assets ?? [];
});
