import {type TTimeframe, ZTimeframe} from '@budgetbuddyde/types';
import {useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

const TIMEFRAME_KEY = 'timeframe';
const DEFAULT_TIMEFRAME: TTimeframe = '1m';

const isValidTimeframe = (timeframe: string | null): timeframe is TTimeframe => {
  return ZTimeframe.safeParse(timeframe).success;
};

export interface IUseTimeframeOptions {
  queryKey?: string;
  defaultTimeframe?: TTimeframe;
}

/**
 * Custom hook to manage and synchronize a timeframe state with URL search parameters.
 *
 * @param {Object} options - Options for the hook.
 * @param {string} [options.queryKey=TIMEFRAME_KEY] - The key used to store the timeframe in the URL search parameters.
 * @param {TTimeframe} [options.defaultTimeframe=DEFAULT_TIMEFRAME] - The default timeframe to use if none is found in the URL.
 * @returns {[TTimeframe, (newTimeframe: TTimeframe) => void]} - Returns the current timeframe and a function to update it.
 *
 * @example
 * const [timeframe, setTimeframe] = useTimeframe({ queryKey: 'timeframe', defaultTimeframe: 'monthly' });
 *
 * @remarks
 * The hook uses URLSearchParams to read and write the timeframe to the URL, ensuring that the state is synchronized with the URL.
 * It also validates the timeframe using the `isValidTimeframe` function.
 */
export const useTimeframe = ({
  queryKey = TIMEFRAME_KEY,
  defaultTimeframe = DEFAULT_TIMEFRAME,
}: IUseTimeframeOptions = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeframe, setLocalTimeframe] = useState<TTimeframe>(() => {
    const initialTimeframe = searchParams.get(queryKey);
    return isValidTimeframe(initialTimeframe) ? initialTimeframe : defaultTimeframe;
  });

  const setTimeframe = useCallback(
    (newTimeframe: TTimeframe) => {
      setLocalTimeframe(newTimeframe);
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.set(queryKey, newTimeframe);
      setSearchParams(updatedParams, {replace: true});
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const urlTimeframe = searchParams.get(queryKey);
    if (!isValidTimeframe(urlTimeframe)) {
      setTimeframe(defaultTimeframe);
      return;
    }
    if (urlTimeframe !== timeframe) {
      setLocalTimeframe(urlTimeframe);
    }
  }, [searchParams, timeframe, setTimeframe]);

  return [timeframe, setTimeframe] as const;
};
