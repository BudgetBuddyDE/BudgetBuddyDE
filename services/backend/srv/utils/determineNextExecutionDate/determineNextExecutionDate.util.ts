import {addMonths, endOfMonth} from 'date-fns';

export function determineNextExecutionDate(executeAt: number, now = new Date()) {
  const today = now.getDate();
  if (executeAt > today) {
    return new Date(now.getFullYear(), now.getMonth(), executeAt);
  } else {
    const nextMonth = addMonths(now, 1);
    const endOfNextMonth = endOfMonth(nextMonth);
    const lastDayOfMonth = endOfNextMonth.getDate();
    const nextExecutionDate = lastDayOfMonth < executeAt ? Math.min(executeAt, lastDayOfMonth) : executeAt;
    return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextExecutionDate);
  }
}
