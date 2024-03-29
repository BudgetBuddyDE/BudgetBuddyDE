import React from 'react';
import { useAuthContext } from '@/components/Auth';
import { StockService } from '../Stock.service';

export function useFetchStockDetails(isin: string) {
  const { session, authOptions } = useAuthContext();
  const [details, setDetails] =
    React.useState<Awaited<ReturnType<typeof StockService.getAssetDetails>>[0]>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchDetails = React.useCallback(async () => {
    if (isin.length === 0) {
      return setError(new Error('No valid ISIN provided'));
    }
    setError(null);
    if (!session || !authOptions) return setError(new Error('No session or authOptions found'));
    setLoading(true);

    const [result, error] = await StockService.getAssetDetails(isin, authOptions);
    if (error) {
      console.error(error);
      setLoading(false);
      return setError(error);
    }

    setDetails(result);
    setLoading(false);
  }, [isin, authOptions]);

  React.useLayoutEffect(() => {
    fetchDetails();
    return () => {
      setLoading(false);
      setError(null);
      setDetails(null);
    };
  }, [session]);

  return {
    loading,
    details: details,
    refresh: fetchDetails,
    error,
  };
}
