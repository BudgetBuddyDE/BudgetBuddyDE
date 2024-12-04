import {addMonths} from 'date-fns';

import {DateService} from '@/services/Date';

import {determineNextExecution} from './determineNextExecution.util';

describe('determineNextExecution', () => {
  it('should return the correct next execution date for the same month', () => {
    const now = new Date();
    const executeAt = now.getDate() + 1;
    const result = determineNextExecution(executeAt);
    const expected = `${executeAt} ${DateService.shortMonthName(now)}.`;
    expect(result).toEqual(expected);
  });

  it('should return the correct next execution date for the next month', () => {
    const now = new Date();
    const executeAt = now.getDate() - 1; // a date in the past
    const result = determineNextExecution(executeAt);
    const expected = `${executeAt} ${DateService.shortMonthName(addMonths(now, 1))}.`;
    expect(result).toEqual(expected);
  });
});
