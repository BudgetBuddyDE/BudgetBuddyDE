import {type TTimeframe} from '@budgetbuddyde/types';
import React from 'react';

import {useAuthContext} from '@/features/Auth';

import {StockService} from '../../StockService';

export function useFetchStockQuotes(isin: string[], exchange: string, timeframe: TTimeframe) {
  const {sessionUser} = useAuthContext();
  const [quotes, setQuotes] = React.useState<Awaited<ReturnType<typeof StockService.getQuotes>>[0]>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchQuotes = React.useCallback(async () => {
    setError(null);
    if (!sessionUser) return setError(new Error('sessionUser is null!'));
    const isins = isin.filter(str => str.length > 0);
    if (!isins.length) return setError(new Error('No valid ISINs found'));
    setLoading(true);
    const [result, error] = await StockService.getQuotes(isins, exchange, timeframe);
    if (error) return setError(error);
    setQuotes(result);
    setLoading(false);
  }, [isin, exchange, timeframe, sessionUser]);

  React.useLayoutEffect(() => {
    fetchQuotes();
    return () => {
      setLoading(false);
      setError(null);
      setQuotes(null);
    };
  }, [sessionUser]);

  return {
    loading,
    quotes: quotes,
    refresh: fetchQuotes,
    updateQuotes: setQuotes,
    error,
  };
}
