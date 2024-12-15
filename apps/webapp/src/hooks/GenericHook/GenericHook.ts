import {type TFilters} from '@/components/Filter';

import {type TEntityStore} from './GenericStore';

export type TGenericHook<T, X = {}, FA = {}> = Omit<
  TEntityStore<T, X, FA>,
  'set' | 'data' | 'getData' | 'fetchData' | 'refreshData'
> & {
  data: ReturnType<TEntityStore<T, X, FA>['getData']>;
  refreshData: (updateLoadingState?: boolean) => Promise<void>;
  refreshDataWithFilter?: (updateLoadingState?: boolean, filters?: TFilters) => Promise<void>;
};
