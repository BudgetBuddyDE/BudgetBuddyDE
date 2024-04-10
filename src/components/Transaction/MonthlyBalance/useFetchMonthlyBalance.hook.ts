import React from 'react';
import {useAuthContext} from '@/components/Auth';
import {useMonthlyBalanceStore} from './MonthlyBalance.store';
import {pb} from '@/pocketbase';
import {z} from 'zod';
import {ZMonthlyBalance, PocketBaseCollection} from '@budgetbuddyde/types';

let mounted = false;

export function useFetchMonthlyBalance() {
  const {sessionUser} = useAuthContext();
  const {data, fetchedAt, fetchedBy, setFetchedData} = useMonthlyBalanceStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchBalances = React.useCallback(async (withLoading?: boolean): Promise<boolean> => {
    setError(null);
    try {
      if (!sessionUser) return false;
      if (withLoading) setLoading(true);
      const records = await pb.collection(PocketBaseCollection.V_MONTHLY_BALANCES).getFullList();
      console.log(records);

      const parsingResult = z.array(ZMonthlyBalance).safeParse(records);
      if (!parsingResult.success) {
        console.error(parsingResult.error);
        return false;
      }
      setFetchedData(parsingResult.data, sessionUser.id);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') return true;
      setError(error instanceof Error ? error : null);
      return false;
    }
  }, []);

  React.useEffect(() => {
    if (!sessionUser || (fetchedBy === sessionUser.id && data) || loading || mounted) return;

    mounted = true;
    fetchBalances(true).then(success => {
      if (!success) mounted = false;
      setLoading(false);
    });

    return () => {
      setLoading(false);
      setError(null);
      mounted = false;
    };
  }, [sessionUser, data]);

  return {
    loading,
    fetched: fetchedAt != null && fetchedBy != null,
    fetchedAt: fetchedAt,
    fetchedBy: fetchedBy,
    balances: data,
    refresh: fetchBalances,
    error,
  };
}
