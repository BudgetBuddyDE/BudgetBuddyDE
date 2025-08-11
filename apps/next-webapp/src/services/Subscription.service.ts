import { z } from 'zod';
import {
  ExpandedSubscription,
  ExpandedSubscriptionsWithCount,
  type TExpandedSubscriptionsWithCount,
  type TExpandedSubscription,
} from '@/types';
import { EntityService } from './Entity.service';
import { type ServiceResponse } from '@/types/Service';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';

export class SubscriptionService extends EntityService {
  static {
    this.entity = 'Subscription';
  }

  /**
   * Retrieves the list of subscriptions from the database.
   * @returns A promise that resolves to an array of TTransaction objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getSubscriptions(
    query?: OdataQuery,
    config?: Partial<OdataConfig>
  ): Promise<ServiceResponse<TExpandedSubscription[]>> {
    try {
      const records = await this.newOdataHandler(config)
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

  /**
   * Retrieves the list of subscriptions from the database with a count of total subscriptions.
   * @param query - The OData query parameters.
   * @param config - The OData configuration options.
   * @returns A promise that resolves to a ServiceResponse containing the subscriptions and their count.
   */
  static async getSubscriptionsWithCount(
    query?: Omit<OdataQuery, '$count' | '$expand'>,
    config?: Partial<Omit<OdataConfig, 'fragment'>>
  ): Promise<ServiceResponse<TExpandedSubscriptionsWithCount>> {
    try {
      const records = await this.newOdataHandler({ ...config, fragment: undefined })
        .get(this.$entityPath)
        .query({
          ...query,
          $expand: 'toCategory,toPaymentMethod',
          $count: true,
        });
      this.logger.debug('Fetched subscriptions:', records);
      const parsingResult = ExpandedSubscriptionsWithCount.safeParse(records);
      if (!parsingResult.success) {
        return this.handleError(new Error('Failed to parse subscriptions'));
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
