'use client';

import React from 'react';

export function useFetch<ReturnValue>(getterFunc: () => Promise<ReturnValue> | ReturnValue) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<ReturnValue | null>(null);
  const [hasFetched, setHasFetched] = React.useState(false);

  const fetchOptions = React.useCallback(() => {
    if (hasFetched) return;

    try {
      setIsLoading(true);
      setHasFetched(true);

      void (async () => {
        setIsLoading(true);
        if (getterFunc.constructor.name === 'AsyncFunction') {
          const response = await getterFunc();
          setData(response);
        } else {
          setData(getterFunc() as ReturnValue);
        }
        setIsLoading(false);
      })();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setIsLoading(false);
    }
  }, [getterFunc, hasFetched]);

  const dataGetter = React.useMemo(() => {
    void fetchOptions();
    return data;
  }, [data, fetchOptions]);

  return { isLoading, error, data: dataGetter };
}
