import {type TTimeframe} from '@budgetbuddyde/types';
import {renderHook} from '@testing-library/react';

import {useTimeframe} from './useTimeframe.hook';

const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

describe('useTimeframe.hook.ts', () => {
  beforeEach(() => {
    mockSetSearchParams.mockClear();
    mockSearchParams.delete('timeframe');
  });

  it('should return default timeframe when no URL param exists', () => {
    const {result} = renderHook(() => useTimeframe());
    const [timeframe] = result.current;
    expect(timeframe).toBe('1m');
  });

  it('should use custom queryKey and defaultTimeframe from options', () => {
    const options = {
      queryKey: 'custom',
      defaultTimeframe: '3m' as TTimeframe,
    };
    const {result} = renderHook(() => useTimeframe(options));
    const [timeframe] = result.current;
    expect(timeframe).toBe('3m');
  });

  it('should fallback to default timeframe when invalid timeframe in URL', () => {
    mockSearchParams.set('timeframe', 'invalid');
    const {result} = renderHook(() => useTimeframe());
    const [timeframe] = result.current;
    expect(timeframe).toBe('1m');
  });

  it('should sync timeframe with URL params', () => {
    mockSearchParams.set('timeframe', '1m');
    const {result} = renderHook(() => useTimeframe());
    const [timeframe] = result.current;
    expect(timeframe).toBe('1m');
  });
});
