import {apiClient} from '@/apiClient';
import {headers} from '@/lib/headers';
import {logger} from '@/logger';
import {RecurringPaymentList, type RecurringPaymentListProps} from './RecurringPaymentList';

export type UpcomingRecurringPaymentList = Pick<RecurringPaymentListProps, 'onAddEntity'>;

export const UpcomingRecurringPaymentList = async ({onAddEntity}: UpcomingRecurringPaymentList) => {
  const [recurringPayments, error] = await apiClient.backend.recurringPayment.getAll(
    {
      to: 6,
      $executeFrom: new Date().getDate(),
    },
    {headers: await headers()},
  );
  if (error) {
    logger.error(error.message);
    throw error;
  }
  return (
    <RecurringPaymentList
      title="Upcoming recurring payments"
      subtitle="Your upcoming recurring payments"
      data={(recurringPayments.data ?? []).map(t => ({
        ID: t.id,
        receiver: t.receiver,
        nextExecution: apiClient.backend.recurringPayment.determineNextExecutionDate(t.executeAt),
        transferAmount: t.transferAmount,
        category: {
          ID: t.category.id,
          name: t.category.name,
        },
        paymentMethod: {
          ID: t.paymentMethod.id,
          name: t.paymentMethod.name,
        },
      }))}
      onAddEntity={onAddEntity}
      noResultsMessage="You don't have any upcoming recurring payments for this month"
    />
  );
};
