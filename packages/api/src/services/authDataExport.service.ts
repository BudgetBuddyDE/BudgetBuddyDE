import type {TApplicationExportFormat} from './applicationData.service';
import {BackendService} from './backend.service';
import {BackendError} from '../error';
import type {TResult} from '../types/common';

export class AuthDataExportService extends BackendService {
  constructor(host: string, entityPath = '/api') {
    super(host, entityPath);
  }

  async exportArchive(format: TApplicationExportFormat): Promise<TResult<Blob>> {
    try {
      const query = this.reqQueryObjToURLSearchParams({format});
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
