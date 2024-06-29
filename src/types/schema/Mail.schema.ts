import {ZDate, ZId} from '@budgetbuddyde/types';
import {z} from 'zod';

export const ZMailOptInPayload = z.object({
  userId: ZId,
  newsletterId: ZId,
});

export const ZVerifyMailOptInPayload = z.object({
  userId: ZId,
  newsletterId: ZId,
});

export const ZMailOptOutPayload = z.object({
  userId: ZId,
  newsletterId: ZId,
});

export const TriggerWeeklyReportPayload = z.object({
  startDate: ZDate,
  endDate: ZDate,
});

export const TriggerMonthlyReportPayload = z.object({
  month: ZDate,
});
