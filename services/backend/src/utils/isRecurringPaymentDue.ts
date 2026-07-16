export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly';

export function isRecurringPaymentDue(payment: {interval: RecurringInterval; createdAt: Date}, executionDate: Date) {
  const monthsSinceCreation =
    (executionDate.getFullYear() - payment.createdAt.getFullYear()) * 12 +
    executionDate.getMonth() -
    payment.createdAt.getMonth();
  if (monthsSinceCreation < 0) return false;
  if (payment.interval === 'yearly') return monthsSinceCreation % 12 === 0;
  if (payment.interval === 'quarterly') return monthsSinceCreation % 3 === 0;
  return true;
}
