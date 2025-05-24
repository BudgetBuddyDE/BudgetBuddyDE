import {SubscriptionService} from '../service';
import {EntityRouter} from './EntityRouter';

export const SubscriptionRouter = EntityRouter.builder(new SubscriptionService(), '/api/subscription')
  .withDefaultRoutes()
  .build();
