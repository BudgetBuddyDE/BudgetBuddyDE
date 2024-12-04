import {
  PocketBaseCollection,
  TApiResponse,
  type TId,
  type TNewsletter,
  type TServiceResponse,
  type TUser,
  ZUser,
} from '@budgetbuddyde/types';
import {type TMailOptInPayload, type TMailOptOutPayload} from '@budgetbuddyde/types/lib/Mail.types';

import {pb} from '@/pocketbase';
import {AuthService} from '@/services/Auth';
import {isRunningInProdEnv, preparePockebaseRequestOptions} from '@/utils';

export class NewsletterService {
  private static host = isRunningInProdEnv() ? (process.env.MAIL_SERVICE_HOST as string) : '/mail_service';
  private static collection = PocketBaseCollection.NEWSLETTER;

  /**
   * Retrieves newsletters based on the specified enabled status.
   * @param enabled - Indicates whether to retrieve enabled newsletters (default: true).
   * @returns A promise that resolves to a tuple containing the list of newsletters and any error that occurred.
   */
  static async getNewsletters(enabled: boolean = true): Promise<TServiceResponse<TNewsletter[]>> {
    try {
      const records = await pb.collection<TNewsletter>(this.collection).getFullList({
        requestKey: null,
        filter: `enabled = ${enabled}`,
      });
      return [records, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves the subscribed newsletters for a user.
   * If the user is identified by an ID, it fetches the user record first.
   * If no newsletters are provided, it fetches all newsletters.
   * Then, it filters the newsletters based on the user's subscribed newsletters.
   *
   * @param user - The user ID or user object.
   * @param newsletters - Optional. The list of newsletters to filter. If not provided, all newsletters will be fetched.
   * @returns A promise that resolves to a tuple containing the filtered newsletters and any potential error.
   */
  static async getSubscribedNewsletters(
    user: TId | NonNullable<TUser>,
    newsletters?: NonNullable<TNewsletter>[],
  ): Promise<TServiceResponse<TNewsletter[]>> {
    if (typeof user === 'string') {
      const [record, err] = await AuthService.getUser(user);
      if (err) return [null, err];
      user = record;
    }

    if (!newsletters || newsletters.length === 0) {
      const [records, err] = await this.getNewsletters();
      if (err) return [null, err];
      newsletters = records;
    }

    return [newsletters.filter(newsletter => user.newsletter.includes(newsletter.id)), null];
  }

  /**
   * Subscribes to the newsletter.
   * @param payload - The payload containing the email and other optional data.
   * @returns A promise that resolves to a tuple containing the response data and any error that occurred.
   */
  static async subscribeToNewsletter(payload: TMailOptInPayload): Promise<TServiceResponse<boolean>> {
    try {
      const response = await fetch(`${this.host}/opt-in`, {
        method: 'POST',
        ...preparePockebaseRequestOptions(),
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as TApiResponse<null>;
      console.log('subscribeToNewsletter', data);
      if (!response.ok) return [null, new Error(data.message!)];

      return [data.data === null, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Unsubscribes a user from the newsletter.
   * @param payload - The payload containing the user's information.
   * @returns A promise that resolves to a tuple containing the user data and any error that occurred during the process.
   */
  static async unsubscribeToNewsletter(payload: TMailOptOutPayload): Promise<TServiceResponse<TUser>> {
    try {
      const response = await fetch(`${this.host}/opt-out`, {
        method: 'POST',
        ...preparePockebaseRequestOptions(),
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as TApiResponse<TUser>;
      console.log('unsubscribeToNewsletter', data);
      if (!response.ok) return [null, new Error(data.message!)];

      const parsingResult = ZUser.safeParse(data.data);
      if (!parsingResult.success) return [null, new Error(parsingResult.error.message)];
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
