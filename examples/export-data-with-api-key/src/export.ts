import {Api} from '@budgetbuddyde/api';
import type {
  TBudget,
  TCategory,
  TExpandedRecurringPayment,
  TExpandedTransaction,
  TPaymentMethod,
} from '@budgetbuddyde/api/types';
import {createApiKeyRequestConfig} from './auth';
import type {CliLogger} from './logger';
import {
  exportEntities,
  type ExampleConfig,
  type ExportableRecord,
  type ExportCommand,
  type ExportEntity,
  type ExportResult,
} from './types';

function unwrapData<T>(entity: ExportEntity, response: {data?: T | T[] | null}) {
  if (Array.isArray(response.data)) return response.data;
  if (response.data) return [response.data];
  throw new Error(`No data returned for ${entity}`);
}

async function unwrapResult<T extends object>(
  entity: ExportEntity,
  result: Promise<[{data?: T | T[] | null}, null] | [null, Error]>,
) {
  const [response, error] = await result;
  if (error) throw error;
  return unwrapData(entity, response as {data?: T | T[] | null});
}

export async function fetchExportEntity(
  api: Api,
  entity: ExportEntity,
  requestConfig: RequestInit,
  limit: number,
  id?: string,
): Promise<ExportableRecord[]> {
  const query = {from: 0, to: limit};

  switch (entity) {
    case 'transactions':
      return id
        ? unwrapResult<TExpandedTransaction>(entity, api.backend.transaction.getById(id, requestConfig))
        : unwrapResult<TExpandedTransaction>(entity, api.backend.transaction.getAll(query, requestConfig));
    case 'recurringPayments':
      return id
        ? unwrapResult<TExpandedRecurringPayment>(entity, api.backend.recurringPayment.getById(id, requestConfig))
        : unwrapResult<TExpandedRecurringPayment>(entity, api.backend.recurringPayment.getAll(query, requestConfig));
    case 'categories':
      return id
        ? unwrapResult<TCategory>(entity, api.backend.category.getById(id, requestConfig))
        : unwrapResult<TCategory>(entity, api.backend.category.getAll(query, requestConfig));
    case 'paymentMethods':
      return id
        ? unwrapResult<TPaymentMethod>(entity, api.backend.paymentMethod.getById(id, requestConfig))
        : unwrapResult<TPaymentMethod>(entity, api.backend.paymentMethod.getAll(query, requestConfig));
    case 'budgets':
      return id
        ? unwrapResult<TBudget>(entity, api.backend.budget.getById(id, requestConfig))
        : unwrapResult<TBudget>(entity, api.backend.budget.getAll(query, requestConfig));
  }
}

export async function fetchBudgetBuddyExport(
  config: ExampleConfig,
  command: ExportCommand,
  logger?: CliLogger,
): Promise<ExportResult> {
  const api = new Api(config.backendUrl);
  const requestConfig = createApiKeyRequestConfig(config.apiKey);
  const entities = command.entity === 'all' ? exportEntities : [command.entity];
  const result: ExportResult = {};

  logger?.info('Starting BudgetBuddyDE export', {
    backendUrl: config.backendUrl,
    entity: command.entity,
    format: command.format,
    id: command.id,
  });
  logger?.debug('Export pagination configured', {from: 0, to: config.limit});

  for (const entity of entities) {
    logger?.debug('Fetching entity', {entity, id: command.id});
    result[entity] = await fetchExportEntity(api, entity, requestConfig, config.limit, command.id);
    logger?.info('Fetched entity records', {entity, count: result[entity]?.length ?? 0});
  }

  return result;
}
