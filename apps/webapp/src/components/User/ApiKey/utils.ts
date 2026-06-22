import type {ApiKey} from './types';

export const isExpired = (expiresAt: ApiKey['expiresAt']) => {
  return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
};

export const getDaysUntilDate = (date: Date) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.ceil((targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
};
