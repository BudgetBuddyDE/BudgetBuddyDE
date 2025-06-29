import {act, renderHook} from '@testing-library/react';
import {describe, expect, test, vi} from 'vitest';

import {use} from './use.hook';

describe('use', () => {
  test('it should initialize with default state', () => {
    const {result} = renderHook(() => use(() => Promise.resolve('data')));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  test('it should set result on successful promise', async () => {
    const {result} = renderHook(() => use(() => Promise.resolve('success')));
    await act(async () => {
      await result.current.refresh();
      // use.nextUpdate() ist manchmal nötig, aber wir rufen refresh direkt
    });
    expect(result.current.result).toBe('success');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('it should set error on rejected promise', async () => {
    const error = new Error('fail');
    const {result} = renderHook(() => use(() => Promise.reject(error)));
    await act(async () => {
      await result.current.refresh().catch(() => {});
    });
    expect(result.current.result).toBeNull();
    expect(result.current.hasError).toBe(true);
    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
  });

  test('it should clear result and error', async () => {
    const error = new Error('fail');
    const {result} = renderHook(() => use(() => Promise.reject(error)));
    await act(async () => {
      await result.current.refresh().catch(() => {});
      result.current.clear();
    });
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  test('it should call lifecycle hooks', async () => {
    const beforeRefresh = vi.fn();
    const afterRefresh = vi.fn();
    const beforeClear = vi.fn();
    const afterClear = vi.fn();
    const {result} = renderHook(() =>
      use(() => Promise.resolve('foo'), {
        beforeRefresh,
        afterRefresh,
        beforeClear,
        afterClear,
      }),
    );

    await act(async () => {
      await result.current.refresh();
    });
    expect(beforeRefresh).toHaveBeenCalledTimes(1);
    expect(afterRefresh).toHaveBeenCalledTimes(1);
    expect(afterRefresh).toHaveBeenCalledWith('foo');

    act(() => {
      result.current.clear();
    });
    expect(beforeClear).toHaveBeenCalledTimes(1);
    expect(afterClear).toHaveBeenCalledTimes(1);
  });
});
