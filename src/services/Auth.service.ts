import {logger} from '../core';
import {type TUser, ZUser, type TServiceResponse} from '@budgetbuddyde/types';
import fetch from 'node-fetch';

export class AuthService {
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
