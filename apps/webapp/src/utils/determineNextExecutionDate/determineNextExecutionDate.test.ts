import {addMonths, isSameDay} from 'date-fns';

import {determineNextExecutionDate} from './determineNextExecutionDate.util';

describe('determineNextExecutionDate', () => {
  it('should return the correct next execution date for the same month', () => {
    const now = new Date();
    const executeAt = now.getDate() + 1;
    const result = determineNextExecutionDate(executeAt);
    const expected = new Date(now.getFullYear(), now.getMonth(), executeAt);
    expect(result).toEqual(expected);
  });

  it('should return the correct next execution date for the next month', () => {
    const now = new Date();
    const executeAt = now.getDate() - 1; // a date in the past
    const result = determineNextExecutionDate(executeAt);
    const nextMonth = addMonths(now, 1);
    const expected = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), executeAt);
    expect(result).toEqual(expected);
  });

  it('should return the correct next execution date when executeAt is today', () => {
    const now = new Date();
    const executeAt = now.getDate();
    const result = determineNextExecutionDate(executeAt);
    const expected = addMonths(now, 1);
    expect(isSameDay(result, expected)).toBeTruthy();
  });

  it('should return the correct next execution date when executeAt is at the end of the month', () => {
    const now = new Date('2023-10-31'); // October 31, 2023
    const executeAt = now.getDate(); // a date in the next month
    const result = determineNextExecutionDate(executeAt, now);
    const expected = new Date('2023-11-30'); // November 30, 2023
    expect(isSameDay(result, expected)).toBeTruthy();
  });
});
