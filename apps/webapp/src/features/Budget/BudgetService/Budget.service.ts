import {
  PocketBaseCollection,
  type TBudget,
  type TCreateBudgetPayload,
  type TDeleteBudgetPayload,
  type TExpandedBudgetProgress,
  type TServiceResponse,
  type TUpdateBudgetPayload,
  ZExpandedBudgetProgress,
} from '@budgetbuddyde/types';
import {RecordModel} from 'pocketbase';
import {z} from 'zod';

import {pb} from '@/pocketbase';

/**
 * The BudgetService class provides methods for interacting with budget data in PocketBase.
 */
export class BudgetService {
  /**
   * Retrieves all budgets with their associated categories and progress.
   *
   * @returns A promise that resolves to a service response containing an array of expanded budget progress objects or an error.
   */
  static async getBudgets(): Promise<TServiceResponse<TExpandedBudgetProgress[]>> {
    try {
      const records = await pb.collection(PocketBaseCollection.V_BUDGET_PROGRESS).getFullList({
        expand: 'categories',
      });
      const parsingResult = z.array(ZExpandedBudgetProgress).safeParse(records);
      return parsingResult.success ? [parsingResult.data, null] : [null, parsingResult.error];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Creates a new budget record in PocketBase.
   *
   * @param budget The payload containing the data for the new budget.
   * @returns A promise that resolves to a service response containing the created budget record or an error.
   */
  static async createBudget(budget: TCreateBudgetPayload): Promise<TServiceResponse<RecordModel>> {
    try {
      const record = await pb.collection(PocketBaseCollection.BUDGET).create(budget, {requestKey: null});
      return [record, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Updates an existing budget record in PocketBase.
   *
   * @param budgetId The ID of the budget to update.
   * @param payload The payload containing the data to update.
   * @returns A promise that resolves to a service response containing the updated budget record or an error.
   */
  static async updateBudget(
    budgetId: TBudget['id'],
    payload: TUpdateBudgetPayload,
  ): Promise<TServiceResponse<RecordModel>> {
    try {
      const record = await pb.collection(PocketBaseCollection.BUDGET).update(budgetId, payload, {requestKey: null});
      return [record, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Deletes a budget record from PocketBase.
   *
   * @param budget The payload containing the ID of the budget to delete.
   * @returns A promise that resolves to a service response indicating whether the deletion was successful or an error.
   */
  static async deleteBudget(budget: TDeleteBudgetPayload): Promise<TServiceResponse<boolean>> {
    try {
      const result = await pb.collection(PocketBaseCollection.BUDGET).delete(budget.id);
      return [result, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
