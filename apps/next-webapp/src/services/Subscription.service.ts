import { z } from 'zod';
import { ExpandedSubscription, type TExpandedSubscription } from '@/types';
import { EntityService } from './Entity.service';
import { type ServiceResponse } from '@/types/Service';
import { headers } from 'next/headers';
import { OdataQuery } from '@tklein1801/o.js';

export class SubscriptionService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/Subscription';

  /**
   * Retrieves the list of subscriptions from the database.
   * @returns A promise that resolves to an array of TTransaction objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getSubscriptions(
    query?: OdataQuery
  ): Promise<ServiceResponse<TExpandedSubscription[]>> {
    try {
      const records = await this.newOdataHandler({
        headers: await headers(),
      })
        .get(this.$entityPath)
        .query({
          $expand: 'toCategory,toPaymentMethod',
          ...query,
        });
      const parsingResult = z.array(ExpandedSubscription).safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse subscriptions'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
