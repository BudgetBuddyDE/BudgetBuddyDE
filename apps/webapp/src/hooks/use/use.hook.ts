import React from 'react';

export interface IUse<R, E extends Error | null = Error | null> {
  isLoading: boolean;
  hasError: boolean;
  readonly result: R | null;
  error: E | null;
  refresh: () => Promise<void>;
  clear: () => void;
}

type State<R, E extends Error | null = Error | null> = {
  isInitialized: boolean; // neccessary to ensure that the result is only loaded once
  isLoading: boolean;
  isRefreshing: boolean;
  result: R | null;
  error: E;
};

type Action<R, E extends Error | null = Error | null> =
  | {type: 'START'; refreshing?: boolean}
  | {type: 'SUCCESS'; payload: R; error?: E}
  | {type: 'FAIL'; payload: E}
  | {type: 'CLEAR'}
  | {type: 'INITIALIZED'};

function reducer<R, E extends Error | null = Error | null>(state: State<R, E>, action: Action<R, E>): State<R, E> {
  switch (action.type) {
    case 'INITIALIZED':
      return {...state, isInitialized: true};
    case 'START':
      return {...state, isLoading: true, isRefreshing: action.refreshing || false};
    case 'SUCCESS':
      return {
        ...state,
        isLoading: false,
        isRefreshing: false,
        result: action.payload,
        error: action.error || (null as E),
      };
    case 'FAIL':
      return {isLoading: false, isRefreshing: false, result: null, error: action.payload, isInitialized: true};
    case 'CLEAR':
      return {isLoading: false, isRefreshing: false, result: null, error: null as E, isInitialized: false};
    default:
      // @ts-expect-error
      throw new Error('Unknown action type: ' + action.type);
  }
}

export const use = <R, E extends Error | null = Error | null>(
  promise: () => R | Promise<R>,
  hooks?: Partial<{
    beforeRefresh: () => void;
    afterRefresh: (result: R | Promise<R>) => void;
    beforeClear: () => void;
    afterClear: () => void;
  }>,
): IUse<R, E> => {
  // Note reference whether a request is already running to avoid race conditions
  const promiseRef = React.useRef<Promise<void> | null>(null);

  const [state, dispatch] = React.useReducer(reducer<R, E>, {
    isInitialized: false,
    isLoading: false,
    isRefreshing: false,
    result: null,
    error: null,
  } as State<R, E>);
  const hasError = React.useMemo(() => state.error !== null, [state.error]);

  const refresh = React.useCallback(async () => {
    hooks?.beforeRefresh?.();
    dispatch({type: 'START'});
    try {
      const result = await promise();
      dispatch({type: 'SUCCESS', payload: result});
      hooks?.afterRefresh?.(result);
    } catch (e: any) {
      dispatch({type: 'FAIL', payload: e});
    }
  }, [promise]);

  const clear = React.useCallback(() => {
    hooks?.beforeClear?.();
    dispatch({type: 'CLEAR'});
    hooks?.afterClear?.();
  }, []);

  // Lazy-getter logic for "result":
  const proxy = React.useMemo(() => {
    return new Proxy(
      {},
      {
        get: (_, prop: string) => {
          if (prop === 'result') {
            // Note: this is a lazy getter, so it will only be called once
            if (!state.isInitialized && !state.isLoading && !promiseRef.current) {
              promiseRef.current = (async () => {
                dispatch({type: 'INITIALIZED'});
                await refresh();
                promiseRef.current = null;
              })();
            }
            return state.result;
          }
          if (prop === 'isLoading') return state.isLoading;
          if (prop === 'hasError') return hasError;
          if (prop === 'error') return state.error;
          if (prop === 'refresh') return refresh;
          if (prop === 'clear') return clear;
          throw new Error(`Property '${prop}' does not exist on use hook result.`);
        },
      },
    ) as IUse<R, E>;
  }, [state, refresh, clear, hasError]);

  return proxy;
};
