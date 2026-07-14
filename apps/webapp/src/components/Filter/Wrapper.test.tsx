import {fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {FilterWrapper} from './Wrapper';

const apiMocks = vi.hoisted(() => ({
  getCategoryValueHelp: vi.fn(),
  getPaymentMethodValueHelp: vi.fn(),
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    backend: {
      category: {getValueHelp: apiMocks.getCategoryValueHelp},
      paymentMethod: {getValueHelp: apiMocks.getPaymentMethodValueHelp},
    },
  },
}));

describe('FilterWrapper quick filters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T10:00:00.000Z'));
    apiMocks.getCategoryValueHelp.mockResolvedValue([[{id: 'cat-1', name: 'Food'}], null]);
    apiMocks.getPaymentMethodValueHelp.mockResolvedValue([[{id: 'pm-1', name: 'Visa'}], null]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('applies the "Today" transaction quick filter', () => {
    const onApply = vi.fn();
    render(<FilterWrapper currentFilters={{}} onApply={onApply} withDateRange />);

    fireEvent.click(screen.getByRole('button', {name: 'Today'}));

    expect(onApply).toHaveBeenCalledTimes(1);
    const arg = onApply.mock.calls[0][0];
    expect(arg.dateFrom).toBeInstanceOf(Date);
    expect(arg.dateTo).toBeInstanceOf(Date);
    expect(arg.dateFrom.toISOString()).toBe('2026-07-14T00:00:00.000Z');
    expect(arg.dateTo.toISOString()).toBe('2026-07-14T23:59:59.999Z');
  });

  it('applies recurring quick filters for activity and schedule', () => {
    const onApply = vi.fn();
    render(<FilterWrapper currentFilters={{}} onApply={onApply} withExecuteDay />);

    fireEvent.click(screen.getByRole('button', {name: 'Active'}));
    fireEvent.click(screen.getByRole('button', {name: 'Planned'}));

    expect(onApply).toHaveBeenNthCalledWith(1, {paused: false});
    expect(onApply).toHaveBeenNthCalledWith(2, {executeFrom: 14, executeTo: null});
  });

  it('renders quick selects for category and payment method', async () => {
    render(<FilterWrapper currentFilters={{}} onApply={vi.fn()} withCategories withPaymentMethods />);

    await vi.runAllTimersAsync();

    expect(apiMocks.getCategoryValueHelp).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPaymentMethodValueHelp).toHaveBeenCalledTimes(1);

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Payment method')).toBeInTheDocument();
  });
});
