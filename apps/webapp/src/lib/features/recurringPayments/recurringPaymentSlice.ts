import type {TCategory} from '@budgetbuddyde/api/category';
import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import type {IGetAllRecurringPaymentsQuery} from '@budgetbuddyde/api/recurringPayment';
import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const recurringPaymentSlice = createEntitySlice(
  'recurringPayment',
  query => apiClient.backend.recurringPayment.getAll(query),
  filters => {
    const extra: Partial<IGetAllRecurringPaymentsQuery> = {};
    if (filters.executeFrom != null) extra.$executeFrom = filters.executeFrom;
    if (filters.executeTo != null) extra.$executeTo = filters.executeTo;
    if (filters.categories?.length) extra.$categories = filters.categories as TCategory['id'][];
    if (filters.excl_categories?.length) extra.$excl_categories = filters.excl_categories as TCategory['id'][];
    if (filters.paymentMethods?.length) extra.$paymentMethods = filters.paymentMethods as TPaymentMethod['id'][];
    if (filters.excl_paymentMethods?.length)
      extra.$excl_paymentMethods = filters.excl_paymentMethods as TPaymentMethod['id'][];
    return extra;
  },
);
