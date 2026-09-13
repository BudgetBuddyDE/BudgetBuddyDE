import {differenceInCalendarDays} from 'date-fns';
import type {ApiKey} from './types';

export const isExpired = (expiresAt: ApiKey['expiresAt']) => {
  return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
};

export const getDaysUntilDate = (date: Date) => differenceInCalendarDays(date, new Date());
