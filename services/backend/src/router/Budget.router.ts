import {ApiResponse} from '../models/ApiResponse';
import {BudgetService} from '../service';
import {EntityRouter} from './EntityRouter';

export const BudgetRouter = EntityRouter.builder(new BudgetService(), '/api/budget')
  .withCreateRoute((req, res, next) => {
    ApiResponse.expressBuilder(res)
      .withStatus(200)
      .withMessage('Budget created successfully')
      .withData(req.body)
      .buildAndSend();
  })
  .withGetAllRoute()
  .withGetByIdRoute()
  .withUpdateByIdRoute((req, res, next) => {
    ApiResponse.expressBuilder(res)
      .withStatus(200)
      .withMessage('Budget updated successfully')
      .withData(req.body)
      .buildAndSend();
  })
  .withDeleteByIdRoute((req, res, next) => {
    ApiResponse.expressBuilder(res)
      .withStatus(200)
      .withMessage('Budget deleted successfully')
      .withData(req.body)
      .buildAndSend();
  })
  .build();
