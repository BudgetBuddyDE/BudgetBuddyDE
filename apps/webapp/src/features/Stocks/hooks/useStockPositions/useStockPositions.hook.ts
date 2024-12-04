import {type TStockPositionWithQuote} from '@budgetbuddyde/types';

import {type TGenericHook} from '@/hooks/GenericHook';

import {useStockStore} from '../../Stock.store';

interface IStockPositionsHook {
  addStockPositions: (data: TStockPositionWithQuote[]) => void;
  updateQuote: (exchange: string, isin: string, newPrice: number) => void;
}

export function useStockPositions(): TGenericHook<TStockPositionWithQuote[], IStockPositionsHook> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore, set} =
    useStockStore();

  const additionalFuncs: IStockPositionsHook = {
    addStockPositions(positions) {
      set([...(getData() ?? []), ...positions]);
    },
    updateQuote(exchange, isin, newPrice) {
      const updatedData: TStockPositionWithQuote[] = [];

      for (const position of getData() ?? []) {
        updatedData.push(
          position.expand.exchange.exchange === exchange && position.isin === isin
            ? {...position, quote: {...position.quote, price: newPrice}}
            : position,
        );
      }

      set(updatedData);
    },
  };

  return {
    ...additionalFuncs,
    data: getData(),
    refreshData,
    isLoading,
    isFetched,
    fetchedAt,
    fetchedBy,
    hasError,
    error,
    resetStore,
  };
}
