import {type TIsin} from '@budgetbuddyde/types';
import React from 'react';

import {useAuthContext} from '@/features/Auth';

import {StockService} from '../StockService/Stock.service';
import {useRelatedStocksStore} from './RelatedStocks.store';

let mounted = false;

export function useFetchRelatedStocks(isin: TIsin, amount: number = 8) {
  const {sessionUser} = useAuthContext();
  const {data, fetchedAt, fetchedBy, setFetchedData} = useRelatedStocksStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchRelatedStocks = React.useCallback(
    async (withLoading?: boolean): Promise<boolean> => {
      setError(null);
      try {
        if (!sessionUser) return false;
        if (isin.length !== 12) {
          setError(new Error('Invalid ISIN'));
          return false;
        }
        if (withLoading) setLoading(true);
        const [relatedStocks, error] = await StockService.getRelatedStocks(isin, amount);
        if (error) {
          setError(error);
          return false;
        }
        if (!relatedStocks) {
          setError(new Error('No related stocks returned'));
          return false;
        }
        setFetchedData(relatedStocks, sessionUser.id);
        return true;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return true;
        setError(error instanceof Error ? error : null);
        return false;
      }
    },
    [sessionUser],
  );

  React.useEffect(() => {
    if (
      !sessionUser ||
      (fetchedBy === sessionUser.id && data) ||
      loading ||
      mounted ||
      (data.length > 0 && data[0].asset._id.identifier === isin)
    )
      return;

    mounted = true;
    fetchRelatedStocks(true).then(success => {
      if (!success) mounted = false;
      setLoading(false);
    });

    return () => {
      setLoading(false);
      setError(null);
      mounted = false;
    };
  }, [sessionUser, isin, amount]);

  return {
    loading,
    fetched: fetchedAt != null && fetchedBy != null,
    fetchedAt: fetchedAt,
    fetchedBy: fetchedBy,
    relatedStocks: data,
    refresh: fetchRelatedStocks,
    error,
  };
}
