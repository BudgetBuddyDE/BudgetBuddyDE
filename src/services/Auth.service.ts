import {type TServiceResponse, type TUser, ZUser} from '@budgetbuddyde/types';
import fetch from 'node-fetch';

import {logger} from '../core';

/**
 * Service responsible for token verification and user retrieval.
 */
export class AuthService {
  /**
   * Verifies the token and retrieves user information from the server.
   * @param token - The token to be verified.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a tuple containing the user data and any potential error.
   */
  static async verifyToken(token: string, userId: NonNullable<TUser>['id']): Promise<TServiceResponse<TUser>> {
    try {
      const response = await fetch(`${process.env.POCKETBASE_URL}/api/collections/users/records/${userId}`, {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = (await response.json()) as
        | {
            id: string;
            collectionId: string;
            collectionName: string;
            username: string;
            verified: boolean;
            emailVisibility: boolean;
            email: string;
            created: string;
            updated: string;
            name: string;
            surname: string;
            avatar: string;
          }
        | {
            code: 404;
            message: string;
            data: {};
          };
      if (!response.ok && 'code' in json && json.code === 404) {
        return [null, new Error(json.message)];
      }

      const parsingResult = ZUser.safeParse(json);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      const err = error as Error;
      logger.error(err.message, {
        name: err.name,
        error: err.message,
        stack: err.stack,
        header: {token},
      });
      return [null, err];
    }
  }
}
