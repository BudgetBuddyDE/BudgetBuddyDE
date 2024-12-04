import {PocketBaseCollection, type TId, type TServiceResponse, type TUser} from '@budgetbuddyde/types';
import {RecordAuthResponse} from 'pocketbase';

import {pb} from '@/pocketbase';

/**
 * Service class for handling authentication related operations.
 */
export class AuthService {
  private static collection = PocketBaseCollection.USERS;

  /**
   * Logs in a user with the provided email and password.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns A promise that resolves to a tuple containing the authenticated user record and any error that occurred during authentication.
   */
  static async login(
    email: string,
    password: string,
  ): Promise<TServiceResponse<RecordAuthResponse<NonNullable<TUser>>>> {
    try {
      const result = await pb.collection<TUser>(this.collection).authWithPassword(email, password);
      if (!result || !result.record) return [null, new Error('Authentication failed')];
      return [result as RecordAuthResponse<NonNullable<TUser>>, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves a user by their ID.
   * @param userId - The ID of the user to retrieve.
   * @returns A promise that resolves to a tuple containing the retrieved user record and any error that occurred during retrieval.
   */
  static async getUser(userId: TId): Promise<TServiceResponse<NonNullable<TUser>>> {
    try {
      const record = await pb.collection<TUser>(this.collection).getOne(userId);
      if (!record) return [null, new Error('User not found')];
      return [record, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
