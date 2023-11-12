import React from 'react';
import { useAuthContext } from '../Auth';
import { useBudgetStore } from './Budget.store';
import { BudgetService } from './Budget.service';

export function useFetchBudget() {
  const { session } = useAuthContext();
  const { data, fetchedAt, fetchedBy, setFetchedData } = useBudgetStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchBudget = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!session) return;
      const [fetchedBudget, error] = await BudgetService.getBudgetsByUuid(session.uuid);
      if (error) return setError(error);
      if (!fetchedBudget) return setError(new Error('No budgets returned'));
      setFetchedData(fetchedBudget, session.uuid);
    } catch (error) {
      setError(error instanceof Error ? error : null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!session || (fetchedBy === session.uuid && data)) return;
    fetchBudget();
    return () => {
      setLoading(false);
      setError(null);
    };
  }, [session, data]);

  return {
    loading,
    fetched: fetchedAt != null && fetchedBy != null,
    fetchedAt: fetchedAt,
    fetchedBy: fetchedBy,
    budgets: data,
    refresh: fetchBudget,
    error,
  };
}
