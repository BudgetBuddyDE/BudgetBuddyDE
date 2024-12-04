import React from 'react';

import {useAuthContext} from '@/features/Auth';

import {StockService} from '../../StockService';

export function useFetchStockDetails(isin: string) {
  const {sessionUser} = useAuthContext();
  const [details, setDetails] = React.useState<Awaited<ReturnType<typeof StockService.getAssetDetails>>[0]>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchDetails = React.useCallback(async () => {
    if (isin.length === 0) {
      return setError(new Error('No valid ISIN provided'));
    }
    setError(null);
    if (!sessionUser) return setError(new Error('sessionUser is null!'));
    setLoading(true);

    const [result, error] = await StockService.getAssetDetails(isin);
    if (error) {
      console.error(error);
      setLoading(false);
      return setError(error);
    }

    setDetails(result);
    setLoading(false);
  }, [isin, sessionUser]);

  React.useLayoutEffect(() => {
    if (details && details.asset._id.identifier === isin) return;
    fetchDetails();
    return () => {
      setLoading(false);
      setError(null);
      setDetails(null);
    };
  }, [sessionUser, isin]);

  return {
    loading,
    details: details,
    refresh: fetchDetails,
    error,
  };
}
