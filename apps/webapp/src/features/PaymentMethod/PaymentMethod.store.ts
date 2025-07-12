import {GenerateGenericStore} from '@/hooks/GenericHook';
import {type TPaymentMethod} from '@/newTypes';

import {PaymentMethodService} from './PaymentMethodService';

export const usePaymentMethodStore = GenerateGenericStore<TPaymentMethod[]>(() =>
  PaymentMethodService.getPaymentMethods(),
);
