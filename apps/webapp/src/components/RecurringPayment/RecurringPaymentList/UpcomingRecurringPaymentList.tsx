import {apiClient} from '@/apiClient';
import {formatLocalDateOnly, parseLocalDateOnly} from '@/components/RecurringPayment/dateOnly';
import {headers} from '@/lib/headers';
import {logger} from '@/logger';
import {RecurringPaymentList, type RecurringPaymentListProps} from './RecurringPaymentList';

export type UpcomingRecurringPaymentList = Pick<RecurringPaymentListProps, 'onAddEntity'>;

export const UpcomingRecurringPaymentList = async ({onAddEntity}: UpcomingRecurringPaymentList) => {
  const today = new Date();
  const through = new Date(today);
  through.setDate(through.getDate() + 365);
  const [recurringPayments, error] = await apiClient.backend.recurringPayment.getOccurrences(
    {
      $dateFrom: formatLocalDateOnly(today),
      $dateTo: formatLocalDateOnly(through),
      from: 0,
      to: 6,
    },
    {headers: await headers()},
  );
  if (error) {
    logger.error('Failed to fetch upcoming recurring payments', error);
    throw error;
  }
  return (
    <RecurringPaymentList
      title="Upcoming recurring payments"
      subtitle="Your upcoming recurring payments"
      data={(recurringPayments.data ?? []).map(occurrence => ({
        ID: `${occurrence.recurringPayment.id}-${occurrence.scheduledFor}`,
        receiver: occurrence.recurringPayment.receiver,
        nextExecution: parseLocalDateOnly(occurrence.scheduledFor),
        transferAmount: occurrence.recurringPayment.transferAmount,
        category: {
          ID: occurrence.recurringPayment.category.id,
          name: occurrence.recurringPayment.category.name,
        },
        paymentMethod: {
          ID: occurrence.recurringPayment.paymentMethod.id,
          name: occurrence.recurringPayment.paymentMethod.name,
        },
      }))}
      onAddEntity={onAddEntity}
      noResultsMessage="You don't have any upcoming recurring payments"
    />
  );
};
