import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const paymentMethodSlice = createEntitySlice('paymentMethod', query =>
  apiClient.backend.paymentMethod.getAll(query),
);
