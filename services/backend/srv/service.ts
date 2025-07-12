import cds from '@sap/cds';
import { Category } from '#cds-models';

export class BackendService extends cds.ApplicationService {
  async init() {
    // Initialize the service
    // this.on('READ', 'Entities', async (req) => {
    //   // Handle read requests for Entities
    //   return [{ id: 1, name: 'Sample Entity' }];
    // });
    console.log(Category);

    // Log service initialization
    cds.log('info', 'BackendService initialized');
    super.init();
  }
}
