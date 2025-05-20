import {ZCreateBudget} from '../db/schema';
import {ApiResponse} from '../models/ApiResponse';
import {User} from '../models/User.model';
import {BudgetService} from '../service';
import {EntityRouter} from './EntityRouter';

const budgetService = new BudgetService();

// FIXME: Don't use any here, but properly type the service
export const BudgetRouter = EntityRouter.builder(budgetService as any, '/api/budget')
  .withCreateRoute(async (req, res, next) => {
    try {
      const body = Array.isArray(req.body) ? req.body : [req.body];
      const result = await budgetService.create(body, ZCreateBudget, req.user as User);

      ApiResponse.expressBuilder(res).withData(result).buildAndSend();
    } catch (err) {
      return next(err);
    }
  })
  .withGetAllRoute()
  .withGetByIdRoute()
  .withUpdateByIdRoute(async (req, res, next) => {
    try {
      const {id} = req.params;
      const body = req.body;
      ApiResponse.expressBuilder(res)
        .withData(await budgetService.updateById(Number(id), body))
        .buildAndSend();
    } catch (err) {
      return next(err);
    }
  })
  .withDeleteByIdRoute()
  .build();
