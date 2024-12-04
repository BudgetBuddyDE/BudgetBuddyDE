import {addMonths} from 'date-fns';

import {DateService} from '@/services/Date';

export function determineNextExecution(executeAt: number) {
  const now = new Date();
  const today = now.getDate();
  if (executeAt >= today) {
    return `${executeAt} ${DateService.shortMonthName(now)}.`;
  } else return `${executeAt} ${DateService.shortMonthName(addMonths(now, 1))}.`;
}
