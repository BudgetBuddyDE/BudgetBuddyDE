import { z } from 'zod';
import {
  ExpandedSubscription,
  ExpandedSubscriptionsWithCount,
  type TExpandedSubscriptionsWithCount,
  type TExpandedSubscription,
  type TCreateOrUpdateSubscription,
  SubscriptionResponse,
  type TSubscriptionResponse,
} from '@/types';
import { EntityService } from './Entity.service';
import { type ServiceResponse } from '@budgetbuddyde/types';
import { type OdataConfig, type OdataQuery } from '@tklein1801/o.js';

export class SubscriptionService extends EntityService {
  static {
    this.entity = 'Subscription';
  }

  /**
   * Creates a new subscription.
   * @param payload The subscription data to create.
   * @returns A promise that resolves to the created subscription or an error.
   */
  static async create(
    payload: TCreateOrUpdateSubscription
  ): Promise<ServiceResponse<TSubscriptionResponse>> {
    try {
      const record = await this.newOdataHandler().post(this.$entityPath, payload).query();
      const parsingResult = SubscriptionResponse.safeParse(record);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }

  /**
   * Updates an existing subscription.
   * @param entityId The ID of the subscription to update.
   * @param payload The updated subscription data.
   * @returns A promise that resolves to the updated subscription or an error.
   */
  static async update(
    entityId: string,
    payload: TCreateOrUpdateSubscription
  ): Promise<ServiceResponse<TSubscriptionResponse>> {
    try {
      const record = await this.newOdataHandler()
        .patch(`${this.$entityPath}(ID=${entityId})`, payload)
        .query();
      const parsingResult = SubscriptionResponse.safeParse(record);
      if (!parsingResult.success) {
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
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
        return this.handleZodError(parsingResult.error);
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
        return this.handleZodError(parsingResult.error);
      }
      return [parsingResult.data, null];
    } catch (e) {
      return this.handleError(e);
    }
  }
}
