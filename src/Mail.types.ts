import {z} from 'zod';
import {ZId} from './PocketBase.types';
import {ZDate} from './Base.type';

export const ZMailOptInPayload = z.object({
  userId: ZId,
  newsletterId: ZId,
});
export type TMailOptInPayload = z.infer<typeof ZMailOptInPayload>;

export const ZVerifyMailOptInPayload = z.object({
  userId: ZId,
  newsletterId: ZId,
});
export type TVerifyMailOptInPayload = z.infer<typeof ZVerifyMailOptInPayload>;

export const ZMailOptOutPayload = z.object({
  userId: ZId,
  newsletterId: ZId,
});
export type TMailOptOutPayload = z.infer<typeof ZMailOptOutPayload>;

export const ZTriggerWeeklyReportPayload = z.object({
  startDate: ZDate,
  endDate: ZDate,
});
export type TTriggerWeeklyReportPayload = z.infer<typeof ZTriggerWeeklyReportPayload>;

export const ZTriggerMonthlyReportPayload = z.object({
  month: ZDate,
});
export type TTriggerMonthlyReportPayload = z.infer<typeof ZTriggerMonthlyReportPayload>;
