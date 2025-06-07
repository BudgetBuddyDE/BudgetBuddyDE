import cds from '@sap/cds';

import { config } from './core/config';

export class DataService extends cds.ApplicationService {
  private logger = config.getLogger(this.name, { label: this.name });

  init(): Promise<void> {
    this.logger.info(`Initializing service: ${this.name}`);

    this.on('error', (err, req) => {
      this.logger.error(err, {
        path: req.path,
        params: req.params,
        entity: req.entity,
        body: req.data,
      });
    });

    return super.init();
  }
}
