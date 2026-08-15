import {act, renderHook, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {useFetch} from './useFetch';

describe('useFetch', () => {
  it('handles rejected promises and clears loading state', async () => {
    const error = new Error('request failed');
    const {result} = renderHook(() => useFetch(() => Promise.reject(error)));

    await waitFor(() => expect(result.current.error).toEqual(error));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('keeps the newest response when getters change while loading', async () => {
    let resolveFirst: (value: string) => void = () => undefined;
    const first = new Promise<string>(resolve => {
      resolveFirst = resolve;
    });
    const getter = vi.fn(() => first);
    const {result, rerender} = renderHook(({currentGetter}) => useFetch(currentGetter), {
      initialProps: {currentGetter: getter},
    });

    const secondGetter = vi.fn(() => Promise.resolve('new'));
    rerender({currentGetter: secondGetter});
    await waitFor(() => expect(result.current.data).toBe('new'));

    await act(async () => resolveFirst('old'));
    expect(result.current.data).toBe('new');
  });
});
