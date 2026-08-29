import {BackendService} from './backend.service';
import {BackendError, ResponseNotJsonError} from '../error';
import type {TResult} from '../types/common';
import {ApplicationImportResponse, type TApplicationImportResult} from '../types/schemas/applicationImport.schema';

export class ApplicationImportService extends BackendService {
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
}
