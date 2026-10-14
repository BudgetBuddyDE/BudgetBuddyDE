import {differenceInCalendarDays} from 'date-fns';
import type {ApiKey} from './types';

export const isExpired = (expiresAt: ApiKey['expiresAt']) => {
  return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
};

export const isActive = (apiKey: ApiKey) => apiKey.enabled && !isExpired(apiKey.expiresAt);

export const getApiKeySummary = (apiKeys: ApiKey[]) => {
  const activeCount = apiKeys.filter(isActive).length;
  const inactiveCount = apiKeys.length - activeCount;
  const lastCreated = apiKeys.reduce<ApiKey['createdAt'] | null>((latest, apiKey) => {
    if (!latest || new Date(apiKey.createdAt).getTime() > new Date(latest).getTime()) {
      return apiKey.createdAt;
    }

    return latest;
  }, null);

  return {activeCount, inactiveCount, lastCreated};
};

export const getDaysUntilDate = (date: Date) => differenceInCalendarDays(date, new Date());
