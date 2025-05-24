import {TransactionService} from '../service';
import {EntityRouter} from './EntityRouter';

export const TransactionRouter = EntityRouter.builder(new TransactionService(), '/api/transaction')
  .withDefaultRoutes()
  .build();
