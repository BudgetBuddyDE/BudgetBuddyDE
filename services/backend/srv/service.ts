import cds from '@sap/cds';
import { Categories, CategoryStats, Subscriptions } from '#cds-models/BackendService';
import { format } from 'date-fns';
import { determineNextExecutionDate } from './utils';

export class BackendService extends cds.ApplicationService {
  private readonly logger = cds.log('bs', { label: this.name, level: 'debug' });
  async init() {
    this.after('READ', Subscriptions, (subscriptions, req) => {
      if (!subscriptions) return;
      for (const subscription of subscriptions) {
        // @ts-expect-error
        subscription.nextExecution = format(
          determineNextExecutionDate(subscription.executeAt as number),
          'yyyy-MM-dd'
        );
      }
    });

    // this.on("READ", CategoryStats, async (req) => {})

    this.logger.info(await SELECT.columns('ID', 'name', 'description').from(Categories));
    this.logger.info('demo');

    return super.init();
  }
}
