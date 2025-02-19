import {type TStockPositionWithQuote, type TUser} from '@budgetbuddyde/types';

import {type IBaseStore} from '@/hooks/GenericHook';
import {GenerateGenericStore} from '@/hooks/GenericHook';
import {logger} from '@/logger';

import {StockService} from './StockService/Stock.service';

export interface IStockStore<T> extends IBaseStore<T[]> {
  fetchedBy: NonNullable<TUser>['id'] | null;
  fetchedAt: Date | null;
  setFetchedData: (data: T[], fetchedBy: NonNullable<TUser>['id'] | null) => void;
  addStockPositions: (data: T[]) => void;
  updateQuote: (exchange: string, isin: string, newPrice: number) => void;
}

export const useStockStore = GenerateGenericStore<TStockPositionWithQuote[]>(async () => {
  const [positions, err] = await StockService.getPositions();
  if (err) {
    logger.error("Couldn't retrieve stock-positions", err);
    return [];
  }
  return positions.sort((a, b) => b.quote.price * b.quantity - a.quote.price * a.quantity) ?? [];
});
