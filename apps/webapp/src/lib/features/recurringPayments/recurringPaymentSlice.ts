import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const recurringPaymentSlice = createEntitySlice('recurringPayment', query =>
  apiClient.backend.recurringPayment.getAll(query),
);
