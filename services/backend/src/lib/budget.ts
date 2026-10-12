import {endOfMonth, startOfMonth} from 'date-fns';
import {fromZonedTime, toZonedTime} from 'date-fns-tz';
import {config} from '../config';

/** Current calendar month in the application's timezone, including its final millisecond. */
export function currentBudgetMonth(time = new Date()): {from: Date; to: Date} {
  const local = toZonedTime(time, config.timezone);
  return {
    from: fromZonedTime(startOfMonth(local), config.timezone),
    to: fromZonedTime(endOfMonth(local), config.timezone),
  };
}
