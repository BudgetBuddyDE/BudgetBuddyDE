import {type TEntityStore} from './GenericStore';

export type TGenericHook<T, X = {}> = Omit<TEntityStore<T, X>, 'set' | 'data' | 'getData' | 'fetchData'> & {
  data: ReturnType<TEntityStore<T, X>['getData']>;
};
