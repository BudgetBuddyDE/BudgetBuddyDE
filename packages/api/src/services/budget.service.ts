import type {Logger} from '@budgetbuddyde/logger';
import {EntityService} from './entity.service';
import type {TCreateOrUpdateBudgetPayload, TEstimatedBudget} from '../types/budget.type';
import type {TResult} from '../types/common';
import {
  CreateBudgetResponse,
  DeleteBudgetResponse,
  EstimatedBudgetResponse,
  GetAllBudgetsResponse,
  GetBudgetResponse,
  UpdateBudgetResponse,
} from '../types/schemas/budget.schema';
import {log} from '../utils/decorators/log.decorator';

export class BudgetService extends EntityService<
  TCreateOrUpdateBudgetPayload,
  Partial<TCreateOrUpdateBudgetPayload>,
  typeof GetAllBudgetsResponse,
  typeof GetBudgetResponse,
  typeof CreateBudgetResponse,
  typeof UpdateBudgetResponse,
  typeof DeleteBudgetResponse
> {
  constructor(host: string, entityPath = '/api/budget', logger?: Logger) {
    super(
      host,
      entityPath,
      {
        getAll: GetAllBudgetsResponse,
        get: GetBudgetResponse,
        create: CreateBudgetResponse,
        update: UpdateBudgetResponse,
        delete: DeleteBudgetResponse,
      },
      logger,
    );
  }

  @log
  async getEstimatedBudget(requestConfig?: RequestInit): Promise<TResult<TEstimatedBudget>> {
    const [result, error] = await this.requestJson(
      `${this.getBaseRequestPath()}/estimated`,
      {
        method: 'GET',
        credentials: 'include',
        headers: new Headers(requestConfig?.headers || {}),
      },
      EstimatedBudgetResponse,
      requestConfig,
    );
    if (error) return [null, error];
    return [result.data ?? [], null];
  }
}
