export interface IFetchDataHook<T> {
  loading: boolean;
  fetched: boolean;
  data: T;
  refresh: () => Promise<void>;
  error: Error | null;
}
