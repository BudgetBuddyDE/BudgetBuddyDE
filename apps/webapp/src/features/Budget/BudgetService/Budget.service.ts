import {z} from 'zod';

import {
  BudgetResponse,
  ExpandedBudget,
  type TBudget,
  type TBudgetResponse,
  type TCreateOrUpdateBudget,
  type TExpandedBudget,
} from '@/newTypes';
import {EntityService} from '@/services/Entity';

/**
 * The BudgetService class provides methods for interacting with budget data in PocketBase.
 */
export class BudgetService extends EntityService {
  private static readonly $entityPath = this.$servicePath + '/Budget';

  /**
   * Creates a new budget.
   *
   * @param payload The payload containing the data for the new budget.
   * @returns A promise that resolves to a service response containing the created budget record or an error.
   */
  static async createBudget(payload: TCreateOrUpdateBudget): Promise<TBudgetResponse> {
    const record = await this.newOdataHandler().post(this.$entityPath, payload).query();
    const parsingResult = BudgetResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Updates a budget with the specified ID using the provided payload.
   * @param budgetId - The ID of the budget to update.
   * @param payload - The payload containing the updated budget data.
   * @returns A Promise that resolves to the updated budget record.
   */
  static async updateBudget(
    budgetId: TCreateOrUpdateBudget['ID'],
    payload: TCreateOrUpdateBudget,
  ): Promise<TBudgetResponse> {
    const record = await this.newOdataHandler().patch(`${this.$entityPath}(ID=${budgetId})`, payload).query();
    const parsingResult = BudgetResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Deletes a budget with the specified ID.
   * @param budgetId - The ID of the budget to delete.
   * @throws If the deletion fails, it logs a warning and returns false.
   * @description Deletes a budget with the specified ID.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deleteBudget(budgetId: TBudget['ID']): Promise<boolean> {
    const response = (await this.newOdataHandler().delete(`${this.$entityPath}(ID=${budgetId})`).query()) as Response;
    if (!response.ok) {
      console.warn('Failed to delete budget:', response.body);
      return false;
    }
    return true;
  }

  /**
   * Retrieves the list of budgets from the database.
   * @returns A promise that resolves to an array of TExpandedBudget objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getBudgets(): Promise<TExpandedBudget[]> {
    const records = await this.newOdataHandler().get(this.$entityPath).query({
      $expand: 'toCategories($expand=toCategory)',
    });
    const parsingResult = z.array(ExpandedBudget).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }
}
