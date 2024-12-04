/**
 * @deprecated
 */
export interface IBaseStore<T> {
  data: T;
  set: (data: T) => void;
  clear: () => void;
}
