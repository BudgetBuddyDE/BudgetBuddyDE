import type {ReactNode} from 'react';

export const dateRangePickerMock = {
  render: undefined as undefined | ((props: unknown) => ReactNode),
  props: undefined as unknown,
};

/** Inert date-range control; suites can render their own interactive stub. */
export function DateRangePicker(props: unknown) {
  dateRangePickerMock.props = props;
  return dateRangePickerMock.render ? dateRangePickerMock.render(props) : <div>Date range</div>;
}

export function resetDateRangePickerMock(): void {
  dateRangePickerMock.render = undefined;
  dateRangePickerMock.props = undefined;
}
