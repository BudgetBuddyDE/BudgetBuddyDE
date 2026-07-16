import type {RecurringPaymentView} from '@/types/finance';

export type RecurringStatus = 'active' | 'inactive' | 'expired';

export function recurringStatus(
  payment: Pick<RecurringPaymentView, 'paused' | 'expiresAt'>,
  now = new Date(),
): RecurringStatus {
  if (payment.expiresAt && payment.expiresAt.getTime() <= now.getTime()) return 'expired';
  if (payment.paused) return 'inactive';
  return 'active';
}
