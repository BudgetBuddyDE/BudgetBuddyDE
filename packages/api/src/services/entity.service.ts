import type {ZodType, z} from 'zod';
import {BackendError, ResponseNotJsonError} from '../error';
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
  ) {
    super(host, basePath);
    this.schemas = schemas;
  }

  @log
  async getAll<Query extends IBaseGetAllQuery>(
    query?: Query,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<GetAllResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}?${this.reqQueryObjToURLSearchParams(query).toString()}`,
        this.mergeRequestConfig(
          {
            method: 'GET',
            headers: new Headers(requestConfig?.headers || {}),
            credentials: 'include',
          },
          requestConfig,
        ),
      );

      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.getAll.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async getById(entityId: string, requestConfig?: RequestInit): Promise<TResult<z.output<GetResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/${entityId}`,
        this.mergeRequestConfig(
          {
            method: 'GET',
            headers: new Headers(requestConfig?.headers || {}),
            credentials: 'include',
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.get.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async create(payload: CreatePayload, requestConfig?: RequestInit): Promise<TResult<z.output<CreateResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}`,
        this.mergeRequestConfig(
          {
            method: 'POST',
            headers: new Headers(
              requestConfig?.headers || {
                'Content-Type': 'application/json',
              },
            ),
            credentials: 'include',
            body: JSON.stringify(payload),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.create.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async createMany(payload: CreatePayload[], requestConfig?: RequestInit): Promise<TResult<z.output<CreateResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/batch`,
        this.mergeRequestConfig(
          {
            method: 'POST',
            headers: new Headers(
              requestConfig?.headers || {
                'Content-Type': 'application/json',
              },
            ),
            credentials: 'include',
            body: JSON.stringify(payload),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.create.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async updateById(
    entityId: string,
    payload: UpdatePayload,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<UpdateResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/${entityId}`,
        this.mergeRequestConfig(
          {
            method: 'PUT',
            headers: new Headers(
              requestConfig?.headers || {
                'Content-Type': 'application/json',
              },
            ),
            credentials: 'include',
            body: JSON.stringify(payload),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.update.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async updateMany(
    updates: Array<{id: string; data: UpdatePayload}>,
    requestConfig?: RequestInit,
  ): Promise<TResult<z.output<UpdateResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/batch`,
        this.mergeRequestConfig(
          {
            method: 'PUT',
            headers: new Headers(
              requestConfig?.headers || {
                'Content-Type': 'application/json',
              },
            ),
            credentials: 'include',
            body: JSON.stringify({updates}),
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.update.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  @log
  async deleteById(entityId: string, requestConfig?: RequestInit): Promise<TResult<z.output<DeleteResult>>> {
    try {
      const response = await this.request(
        `${this.getBaseRequestPath()}/${entityId}`,
        this.mergeRequestConfig(
          {
            method: 'DELETE',
            headers: new Headers(requestConfig?.headers || {}),
            credentials: 'include',
          },
          requestConfig,
        ),
      );
      if (!response.ok) {
        throw new BackendError(response.status, response.statusText);
      }
      if (!this.isJsonResponse(response)) {
        throw new ResponseNotJsonError();
      }
      const data = await response.json();

      const parsingResult = this.schemas.delete.safeParse(data);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }

      return [parsingResult.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
