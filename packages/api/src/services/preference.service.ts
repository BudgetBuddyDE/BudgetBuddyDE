import type {Logger} from '@budgetbuddyde/logger';
import {BackendService} from './backend.service';
import type {TResult, TypeOfSchema} from '../types';
import type {TUpdatePreferencePayload} from '../types/preference.type';
import {GetPreferenceResponse, UpdatePreferenceResponse} from '../types/schemas/preference.schema';
import {log} from '../utils/decorators/log.decorator';

export class PreferenceService extends BackendService {
  constructor(host: string, logger?: Logger) {
    super(host, '/api/preference', logger);
  }

  @log
  async get(requestConfig?: RequestInit): Promise<TResult<TypeOfSchema<typeof GetPreferenceResponse>>> {
    return this.requestJson(
      this.getBaseRequestPath(),
      {method: 'GET', headers: new Headers(requestConfig?.headers || {}), credentials: 'include'},
      GetPreferenceResponse,
      requestConfig,
    );
  }

  @log
  async update(
    payload: TUpdatePreferencePayload,
    requestConfig?: RequestInit,
  ): Promise<TResult<TypeOfSchema<typeof UpdatePreferenceResponse>>> {
    return this.requestJson(
      this.getBaseRequestPath(),
      {
        method: 'PUT',
        headers: new Headers(requestConfig?.headers || {'Content-Type': 'application/json'}),
        credentials: 'include',
        body: JSON.stringify(payload),
      },
      UpdatePreferenceResponse,
      requestConfig,
    );
  }
}
