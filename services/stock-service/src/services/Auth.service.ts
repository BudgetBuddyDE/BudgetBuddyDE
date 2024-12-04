import {PocketBaseCollection, type TServiceResponse, type TUser, ZUser} from '@budgetbuddyde/types';
import fetch from 'node-fetch';

import {logger} from '../logger';
import {pb} from '../pocketbase';

/**
 * Service responsible for token verification and user retrieval.
 */
export class AuthService {
  static readonly POCKETBASE_URL = process.env.POCKETBASE_URL;

  /**
   * Verifies the token and retrieves user information from the server.
   * @param token - The token to be verified.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a tuple containing the user data and any potential error.
   */
  static async verifyToken(token: string, userId: NonNullable<TUser>['id']): Promise<TServiceResponse<TUser>> {
    try {
      const response = await fetch(`${this.POCKETBASE_URL}/api/collections/users/records/${userId}`, {
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

  /**
   * Retrieves a user by their ID.
   * @param userId - The ID of the user to retrieve.
   * @returns A promise that resolves to a tuple containing the user data and any potential error.
   */
  static async getUser(userId: string): Promise<TServiceResponse<TUser>> {
    try {
      const result = await pb.collection<TUser>(PocketBaseCollection.USERS).getOne(userId);
      if (!result) return [null, new Error('User not found')];

      const parsingResult = ZUser.safeParse(result);
      if (!parsingResult.success) return [null, parsingResult.error];
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
