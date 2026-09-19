import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {categoryOption, paymentMethodOption} from '../InsightsReport.fixtures';
import {InsightsReportFilters} from './InsightsReportFilters';

vi.mock('@/components/Form/DateRangePicker', () => ({
  DateRangePicker: ({
    onDateRangeChange,
  }: {
    onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  }) => (
    <button
      type="button"
      data-testid="date-range"
      onClick={() => onDateRangeChange?.(new Date('2026-02-01T00:00:00.000Z'), new Date('2026-02-28T00:00:00.000Z'))}
    >
      Set range
    </button>
  ),
}));

const from = new Date('2026-01-01T00:00:00.000Z');
const to = new Date('2026-12-31T00:00:00.000Z');

const renderFilters = (overrides: {
  categories?: TCategoryVH[];
  paymentMethods?: TPaymentMethodVH[];
  granularity?: 'auto' | 'day' | 'week' | 'month';
  comparison?: 'previous' | 'none';
}) => {
  const onDateRangeChange = vi.fn();
  const onCategoriesChange = vi.fn();
  const onPaymentMethodsChange = vi.fn();
  const onGranularityChange = vi.fn();
  const onComparisonChange = vi.fn();

  render(
    <InsightsReportFilters
      from={from}
      to={to}
      categories={overrides.categories ?? []}
      paymentMethods={overrides.paymentMethods ?? []}
      categoryOptions={[categoryOption('cat-1', 'Food'), categoryOption('cat-2', 'Rent')]}
      paymentMethodOptions={[paymentMethodOption('pm-1', 'Card'), paymentMethodOption('pm-2', 'Cash')]}
      granularity={overrides.granularity ?? 'auto'}
      comparison={overrides.comparison ?? 'previous'}
      onDateRangeChange={onDateRangeChange}
      onCategoriesChange={onCategoriesChange}
      onPaymentMethodsChange={onPaymentMethodsChange}
      onGranularityChange={onGranularityChange}
      onComparisonChange={onComparisonChange}
    />,
  );

  return {onDateRangeChange, onCategoriesChange, onPaymentMethodsChange, onGranularityChange, onComparisonChange};
};

afterEach(() => cleanup());

describe('InsightsReportFilters', () => {
  it('forwards date range changes to the parent', () => {
    const {onDateRangeChange} = renderFilters({});

    fireEvent.click(screen.getByTestId('date-range'));

    expect(onDateRangeChange).toHaveBeenCalledWith(
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-28T00:00:00.000Z'),
    );
  });

  it('emits the selected granularity', () => {
    const {onGranularityChange} = renderFilters({});

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Grouping'}));
    fireEvent.click(screen.getByRole('option', {name: 'Day'}));

    expect(onGranularityChange).toHaveBeenCalledWith('day');
  });

  it('emits the selected comparison', () => {
    const {onComparisonChange} = renderFilters({});

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Compare'}));
    fireEvent.click(screen.getByRole('option', {name: 'No comparison'}));

    expect(onComparisonChange).toHaveBeenCalledWith('none');
  });

  it('emits a selected category option', async () => {
    const {onCategoriesChange} = renderFilters({});

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Categories'}));
    await waitFor(() => expect(screen.getByRole('option', {name: 'Food'})).toBeTruthy());
    fireEvent.click(screen.getByRole('option', {name: 'Food'}));

    expect(onCategoriesChange).toHaveBeenCalledWith([categoryOption('cat-1', 'Food')]);
  });

  it('emits a selected payment method option', async () => {
    const {onPaymentMethodsChange} = renderFilters({});

    fireEvent.mouseDown(screen.getByRole('combobox', {name: 'Payment methods'}));
    await waitFor(() => expect(screen.getByRole('option', {name: 'Cash'})).toBeTruthy());
    fireEvent.click(screen.getByRole('option', {name: 'Cash'}));

    expect(onPaymentMethodsChange).toHaveBeenCalledWith([paymentMethodOption('pm-2', 'Cash')]);
  });

  it('renders the currently selected categories and payment methods', () => {
    renderFilters({
      categories: [categoryOption('cat-1', 'Food')],
      paymentMethods: [paymentMethodOption('pm-2', 'Cash')],
    });

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });
});
