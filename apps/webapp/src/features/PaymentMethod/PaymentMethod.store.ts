import {type TPaymentMethod} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';

import {PaymentMethodService} from './PaymentMethodService';

export const usePaymentMethodStore = GenerateGenericStore<TPaymentMethod[]>(() =>
  PaymentMethodService.getPaymentMethods(),
);
