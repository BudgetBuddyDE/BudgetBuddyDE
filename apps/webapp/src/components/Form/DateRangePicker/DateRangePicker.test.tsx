import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {DateRangePicker} from './DateRangePicker';

const startDate = new Date('2024-01-01T00:00:00.000Z');
const endDate = new Date('2024-01-31T00:00:00.000Z');

vi.mock('../DatePicker', () => ({
  DatePicker: ({
    label,
    onChange,
    onClose,
  }: {
    label: string;
    onChange?: (date: Date | null) => void;
    onClose?: () => void;
  }) => (
    <button
      type="button"
      data-testid={`picker-${label}`}
      onClick={() => {
        onChange?.(label === 'End' ? endDate : startDate);
        onClose?.();
      }}
    >
      {label}
    </button>
  ),
}));

describe('DateRangePicker', () => {
  it('reports the selected end date (dateTo) when the end picker closes', () => {
    const onDateRangeChange = vi.fn();

    render(<DateRangePicker onDateRangeChange={onDateRangeChange} />);

    fireEvent.click(screen.getByTestId('picker-End'));

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    expect(onDateRangeChange).toHaveBeenCalledWith(null, endDate);
  });

  it('reports both start and end dates when both pickers are used', () => {
    const onDateRangeChange = vi.fn();

    render(<DateRangePicker onDateRangeChange={onDateRangeChange} />);

    // Select start date first (onChange fires, onClose opens END picker)
    fireEvent.click(screen.getByTestId('picker-Start'));
    // Then select end date — onClose fires the combined callback
    fireEvent.click(screen.getByTestId('picker-End'));

    // Only one callback call (on end picker close)
    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    expect(onDateRangeChange).toHaveBeenCalledWith(startDate, endDate);
  });

  it('does not call onDateRangeChange when no end picker interaction occurs', () => {
    const onDateRangeChange = vi.fn();

    render(<DateRangePicker onDateRangeChange={onDateRangeChange} />);

    // Only interact with start picker
    fireEvent.click(screen.getByTestId('picker-Start'));

    expect(onDateRangeChange).not.toHaveBeenCalled();
  });

  it('seeds the pickers with provided defaultValue', () => {
    const onDateRangeChange = vi.fn();

    render(<DateRangePicker defaultValue={{startDate, endDate}} onDateRangeChange={onDateRangeChange} />);

    // Even with a defaultValue pre-set, no callback fires until the end picker closes
    expect(onDateRangeChange).not.toHaveBeenCalled();

    // When the end picker closes the pre-seeded dates are reported correctly
    fireEvent.click(screen.getByTestId('picker-End'));
    expect(onDateRangeChange).toHaveBeenCalledWith(startDate, endDate);
  });
});
