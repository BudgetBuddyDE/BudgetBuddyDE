import React from 'react';

import {useAuthContext} from '@/features/Auth';

import {StockService} from '../../StockService';

export function useFetchStockDividends(isin: string[]) {
  const {sessionUser} = useAuthContext();
  const [dividends, setDividends] = React.useState<Awaited<ReturnType<typeof StockService.getDividends>>[0]>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchDividends = React.useCallback(async () => {
    setError(null);
    if (!sessionUser) return setError(new Error('sessionUser is null!'));
    const isins = isin.filter(str => str.length > 0);
    if (!isins.length) return setError(new Error('No valid ISINs found'));
    setLoading(true);

    const [result, error] = await StockService.getDividends(isins);
    if (error) return setError(error);
    setDividends(result);
    setLoading(false);
  }, [isin, sessionUser]);

  React.useLayoutEffect(() => {
    fetchDividends();
    return () => {
      setLoading(false);
      setError(null);
      setDividends(null);
    };
  }, [sessionUser]);

  return {
    loading,
    dividends: dividends,
    refresh: fetchDividends,
    error,
  };
}
