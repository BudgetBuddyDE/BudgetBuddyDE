import {type TUser, ZUser, type TApiResponse} from '@budgetbuddyde/types';
import fetch from 'node-fetch';
import {logger} from '../core';

export class AuthService {
  private static host: string = process.env.BACKEND_HOST + '/v1/auth';

  static buildBearerToken(user: Pick<TUser, 'uuid' | 'password'> | TUser): string {
    return `Bearer ${user.uuid}:${user.password}`;
  }

  /**
   * Validates the provided auth header
   * @param uuid The uuid of the user
   * @param password The password of the user
   * @returns A tuple with the first value being the user object and the second value being an error
   */
  static async validateAuthHeader(authHeader: string): Promise<[TUser | null, Error | null]> {
    try {
      const response = await fetch(this.host + '/verify/token', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
      });
      const json = (await response.json()) as TApiResponse<TUser>;
      if (json.status !== 200) {
        throw new Error(json.message!);
      }

      const parsingResult = ZUser.safeParse(json.data);
      if (parsingResult.success === false) {
        throw new Error(parsingResult.error.message);
      }
      const parsedData = parsingResult.data;

      return [parsedData, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
