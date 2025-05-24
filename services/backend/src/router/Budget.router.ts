import {BudgetService} from '../service';
import {EntityRouter} from './EntityRouter';

export const BudgetRouter = EntityRouter.builder(new BudgetService(), '/api/budget')
  .withGetAllRoute()
  .withGetByIdRoute()
  .build();
