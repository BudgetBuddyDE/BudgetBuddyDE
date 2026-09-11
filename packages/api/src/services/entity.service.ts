import type {Logger} from '@budgetbuddyde/logger';
import type {ZodType, z} from 'zod';
import {BackendService} from './backend.service';
import type {TResult} from '../types/common';
import type {IBaseGetAllQuery} from '../types/interfaces/query.interface';
import {log} from '../utils/decorators/log.decorator';

type TEntitySchemas<
  GetAll extends z.ZodType,
  Get extends z.ZodType,
  Create extends z.ZodType,
  Update extends z.ZodType,
  Delete extends z.ZodType,
> = {
  getAll: GetAll;
  get: Get;
  create: Create;
  update: Update;
  delete: Delete;
};

export class EntityService<
  CreatePayload,
  UpdatePayload,
  GetAllResult extends ZodType,
  GetResult extends ZodType,
  CreateResult extends ZodType,
  UpdateResult extends ZodType,
  DeleteResult extends ZodType,
> extends BackendService {
  protected schemas: TEntitySchemas<GetAllResult, GetResult, CreateResult, UpdateResult, DeleteResult>;

  constructor(
    host: string,
    basePath: string,
    schemas: TEntitySchemas<GetAllResult, GetResult, CreateResult, UpdateResult, DeleteResult>,
    logger?: Logger,
  ) {
    super(host, basePath, logger);
    this.schemas = schemas;
  }

  protected async fetchValueHelp<T extends ZodType>(
    schema: T,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<T>>> {
    const [response, error] = await this.getAll(undefined, requestConfig);
    if (error) return [null, error];

    const parsed = schema.safeParse((response as {data?: unknown} | null)?.data ?? []);
    if (!parsed.success) {
      return this.handleZodError(parsed.error);
    }
    return [parsed.data, null];
  }

  @log
  async getAll<Query extends IBaseGetAllQuery>(
    query?: Query,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<GetAllResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}?${this.reqQueryObjToURLSearchParams(query).toString()}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      this.schemas.getAll,
      requestConfig,
    );
  }

  @log
  async getById(entityId: string, requestConfig?: RequestInit): Promise<TResult<z.output<GetResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/${entityId}`,
      {
        method: 'GET',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      this.schemas.get,
      requestConfig,
    );
  }

  @log
  async create(payload: CreatePayload, requestConfig?: RequestInit): Promise<TResult<z.output<CreateResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}`,
      {
        method: 'POST',
        headers: new Headers(requestConfig?.headers || {'Content-Type': 'application/json'}),
        credentials: 'include',
        body: JSON.stringify(payload),
      },
      this.schemas.create,
      requestConfig,
    );
  }

  @log
  async createMany(payload: CreatePayload[], requestConfig?: RequestInit): Promise<TResult<z.output<CreateResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/batch`,
      {
        method: 'POST',
        headers: new Headers(requestConfig?.headers || {'Content-Type': 'application/json'}),
        credentials: 'include',
        body: JSON.stringify(payload),
      },
      this.schemas.create,
      requestConfig,
    );
  }

  @log
  async updateById(
    entityId: string,
    payload: UpdatePayload,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<UpdateResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/${entityId}`,
      {
        method: 'PUT',
        headers: new Headers(requestConfig?.headers || {'Content-Type': 'application/json'}),
        credentials: 'include',
        body: JSON.stringify(payload),
      },
      this.schemas.update,
      requestConfig,
    );
  }

  @log
  async updateMany(
    updates: Array<{id: string; data: UpdatePayload}>,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<UpdateResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/batch`,
      {
        method: 'PUT',
        headers: new Headers(requestConfig?.headers || {'Content-Type': 'application/json'}),
        credentials: 'include',
        body: JSON.stringify({updates}),
      },
      this.schemas.update,
      requestConfig,
    );
  }

  @log
  async deleteById(entityId: string, requestConfig?: RequestInit): Promise<TResult<z.output<DeleteResult>>> {
    return this.requestJson(
      `${this.getBaseRequestPath()}/${entityId}`,
      {
        method: 'DELETE',
        headers: new Headers(requestConfig?.headers || {}),
        credentials: 'include',
      },
      this.schemas.delete,
      requestConfig,
    );
  }
}
