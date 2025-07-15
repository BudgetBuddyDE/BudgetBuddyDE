import {type TCategory, type TTransaction} from '@budgetbuddyde/types';
import {subDays} from 'date-fns';
import {z} from 'zod';

import {type TSelectCategoriesOption} from '@/features/Insights/InsightsDialog/SelectCategories';
import {
  Category,
  CategoryResponse,
  Category_VH,
  type TCategoryResponse,
  type TCategory_VH,
  type TCreateOrUpdateCategory,
  type TCategory as _TCategory,
} from '@/newTypes';
import {odata} from '@/odata.client';

import {type TCategoryAutocompleteOption} from '../Autocomplete';

export class CategoryService {
  private static readonly $servicePath = '/odata/v4/backend';
  private static readonly $entityPath = this.$servicePath + '/Category';
  private static readonly $valueHelpPath = this.$servicePath + '/Category_VH';

  /**
   * Creates a new category.
   * @param payload - The payload containing the data for the new category.
   * @returns A promise that resolves to the created category record.
   */
  static async createCategory(payload: TCreateOrUpdateCategory): Promise<TCategoryResponse> {
    const record = await odata.post(this.$entityPath, payload).query();
    const parsingResult = CategoryResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Updates a category with the specified ID using the provided payload.
   * @param categoryId - The ID of the category to update.
   * @param payload - The payload containing the updated category data.
   * @returns A Promise that resolves to the updated category record.
   */
  static async updateCategory(
    categoryId: _TCategory['ID'],
    payload: TCreateOrUpdateCategory,
  ): Promise<TCategoryResponse> {
    const record = await odata.put(`${this.$entityPath}(ID=${categoryId})`, payload).query();
    const parsingResult = CategoryResponse.safeParse(record);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Deletes a category with the specified ID.
   * @param categoryId - The ID of the category to delete.
   * @throws If the deletion fails, it logs a warning and returns false.
   * @description Deletes a category with the specified ID.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deleteCategory(categoryId: _TCategory['ID']): Promise<boolean> {
    const response = (await odata.delete(`${this.$entityPath}(ID=${categoryId})`).query()) as Response;
    if (!response.ok) {
      console.warn('Failed to delete category:', response.body);
      return false;
    }
    return true;
  }

  /**
   * Retrieves the list of categories from the database.
   * @returns A promise that resolves to an array of TCategory objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getCategories(): Promise<_TCategory[]> {
    const records = await odata.get(this.$entityPath).query();
    const parsingResult = z.array(Category).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Retrieves the list of categories from the database.
   * @returns A promise that resolves to an array of TCategory objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getCategoryValueHelps(): Promise<TCategory_VH[]> {
    const records = await odata.get(this.$valueHelpPath).query();
    const parsingResult = z.array(Category_VH).safeParse(records);
    if (!parsingResult.success) throw parsingResult.error;
    return parsingResult.data;
  }

  /**
   * Sorts the autocomplete options for categories based on transaction usage.
   *
   * @param transactions - The list of transactions.
   * @param days - The number of days to consider for transaction usage. Default is 30 days.
   * @returns The sorted autocomplete options for categories.
   */
  static sortAutocompleteOptionsByTransactionUsage(
    categories: _TCategory[],
    transactions: TTransaction[],
    days: number = 30,
  ): TCategoryAutocompleteOption[] {
    const uniqueCatgegories = categories;
    const now = new Date();
    const startDate = subDays(now, days);
    const categoryFrequencyMap: {[categoryId: string]: number} = {};

    let pastNTransactions = transactions.filter(({processed_at}) => processed_at >= startDate);
    if (pastNTransactions.length < 1) pastNTransactions = transactions.slice(0, 50);
    pastNTransactions.forEach(
      ({
        processed_at,
        expand: {
          category: {id},
        },
      }) => {
        if (processed_at >= startDate && processed_at <= now) {
          categoryFrequencyMap[id] = (categoryFrequencyMap[id] || 0) + 1;
        }
      },
    );

    return uniqueCatgegories
      .map(category => ({
        ...category,
        frequency: categoryFrequencyMap[category.ID] || -1,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .map(({ID, name}) => ({
        name: name,
        ID: ID,
      }));
  }

  /**
   * Filters an array of categories based on a keyword.
   * @param categories - The array of categories to filter.
   * @param keyword - The keyword to filter the categories by.
   * @returns The filtered array of categories.
   */
  static filter(categories: TCategory[], keyword: string): TCategory[] {
    const lowerKeyword = keyword.toLowerCase();
    return categories.filter(
      ({name, description}) =>
        name.toLowerCase().includes(lowerKeyword) || description?.toLowerCase().includes(lowerKeyword),
    );
  }

  /**
   * Converts an array of TCategory objects into a different format.
   * @param categories - The array of categories to convert.
   * @returns An array of formatted category options.
   */
  static toSelectOption(categories: TCategory[]): TSelectCategoriesOption[] {
    return categories.map(({id, name}) => ({
      label: name,
      value: id,
    }));
  }
}
