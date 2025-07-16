import cds from '@sap/cds';
import { Subscriptions } from '#cds-models/BackendService';
import { format } from 'date-fns';
import { determineNextExecutionDate } from './utils';

export class BackendService extends cds.ApplicationService {
  init() {
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

    return super.init();
  }
}
