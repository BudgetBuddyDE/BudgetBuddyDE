import {BackendService} from './backend.service';
import {BackendError, ResponseNotJsonError} from '../error';
import type {TResult} from '../types/common';
import {ApplicationImportResponse, type TApplicationImportResult} from '../types/schemas/applicationImport.schema';

export const applicationExportResources = [
  'categories',
  'payment-methods',
  'transactions',
  'recurring-payments',
  'budgets',
  'attachments',
] as const;

export type TApplicationExportResource = (typeof applicationExportResources)[number];
export type TApplicationExportFormat = 'csv' | 'json';

export class ApplicationDataService extends BackendService {
  constructor(host: string, entityPath = '/api/application') {
    super(host, entityPath);
  }

  async importArchive(file: File, mode: 'preview' | 'commit'): Promise<TResult<TApplicationImportResult>> {
    try {
      const body = new FormData();
      body.set('archive', file);
      body.set('mode', mode);
      const response = await this.request(`${this.getBaseRequestPath()}/import`, {
        body,
        credentials: 'include',
        method: 'POST',
      });
      if (!response.ok) {
        const error = this.isJsonResponse(response) ? await response.json().catch(() => null) : null;
        throw new BackendError(response.status, error?.message ?? response.statusText);
      }
      if (!this.isJsonResponse(response)) throw new ResponseNotJsonError();
      const parsed = ApplicationImportResponse.safeParse(await response.json());
      if (!parsed.success) return this.handleZodError(parsed.error);
      return [parsed.data.data, null];
    } catch (error) {
      return this.handleError(error);
    }
  }

  async exportArchive({
    format,
    resources,
  }: {
    format: TApplicationExportFormat;
    resources: readonly TApplicationExportResource[];
  }): Promise<TResult<Blob>> {
    try {
      const query = this.reqQueryObjToURLSearchParams({format, resources});
      const response = await this.request(`${this.getBaseRequestPath()}/export?${query}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = this.isJsonResponse(response) ? await response.json().catch(() => null) : null;
        throw new BackendError(response.status, error?.message ?? response.statusText);
      }
      return [await response.blob(), null];
    } catch (error) {
      return this.handleError(error);
    }
  }
}
