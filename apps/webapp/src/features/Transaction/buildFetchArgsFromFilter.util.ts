import {type TFilters} from '@/components/Filter';
import {type TTransactionStoreFetchArgs} from '@/features/Transaction/Transaction.store.ts';

export function buildFetchArgsFromFilter(filter: TFilters): TTransactionStoreFetchArgs {
  return {
    startDate: filter.startDate,
    endDate: filter.endDate,
  };
}
