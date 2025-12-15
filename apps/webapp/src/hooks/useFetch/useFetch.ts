'use client';

import React from 'react';

export function useFetch<ReturnValue>(getterFunc: () => Promise<ReturnValue> | ReturnValue) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<ReturnValue | null>(null);
  const [hasFetched, setHasFetched] = React.useState(false);
  // Track previous getter to detect meaningful changes
  const prevGetterRef = React.useRef(getterFunc);

  const fetchDataFunc = React.useCallback(
    (force = false) => {
      if (hasFetched && !force) return;

      try {
        setIsLoading(true);
        setHasFetched(true);

        void (async () => {
          const isAsyncGetter = getterFunc.constructor.name === 'AsyncFunction';
          const retrievedData = isAsyncGetter ? await getterFunc() : (getterFunc() as ReturnValue);
          setData(retrievedData);
          setIsLoading(false);
        })();
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      }
    },
    [getterFunc, hasFetched],
  );

  const dataGetter = React.useMemo(() => {
    // void fetchOptions();
    return data;
  }, [data]);

  React.useEffect(() => {
    if (!hasFetched) {
      // Initial fetch
      void fetchDataFunc();
    } else if (prevGetterRef.current !== getterFunc) {
      // Force refetch on getter change
      // REVISIT: This may cause loops in some scenarios when used without an memoized getterFunc in the client-component :/
      void fetchDataFunc(true);
    }

    // update the ref for subsequent comparisons
    prevGetterRef.current = getterFunc;
    // Including fetchOptions is safe; guard conditions prevent loops
  }, [getterFunc, hasFetched, fetchDataFunc]);

  return {isLoading, error, data: dataGetter, hasFetchedData: hasFetched};
}
