import {PaymentMethodService} from '../service';
import {EntityRouter} from './EntityRouter';

export const PaymentMethodRouter = EntityRouter.builder(new PaymentMethodService(), '/api/payment-method')
  .withDefaultRoutes()
  .build();
