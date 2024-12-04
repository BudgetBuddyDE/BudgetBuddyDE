import {
  PocketBaseCollection,
  type TCategory,
  type TCreateCategoryPayload,
  type TTransaction,
  type TUpdateCategoryPayload,
  ZCategory,
} from '@budgetbuddyde/types';
import {subDays} from 'date-fns';
import {type RecordModel} from 'pocketbase';
import {z} from 'zod';

import {pb} from '@/pocketbase';

import {type TCategoryAutocompleteOption} from '../Autocomplete';

export class CategoryService {
  /**
   * Creates a new category.
   * @param payload - The payload containing the data for the new category.
   * @returns A promise that resolves to the created category record.
   */
  static async createCategory(payload: TCreateCategoryPayload): Promise<RecordModel> {
    const record = await pb.collection(PocketBaseCollection.CATEGORY).create(payload, {requestKey: null});
    return record;
  }

  /**
   * Updates a category with the specified ID using the provided payload.
   * @param categoryId - The ID of the category to update.
   * @param payload - The payload containing the updated category data.
   * @returns A Promise that resolves to the updated category record.
   */
  static async updateCategory(categoryId: TCategory['id'], payload: TUpdateCategoryPayload): Promise<RecordModel> {
    const record = await pb.collection(PocketBaseCollection.CATEGORY).update(categoryId, payload);
    return record;
  }

  /**
   * Deletes a category with the specified ID.
   *
   * @param categoryId - The ID of the category to delete.
   * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  static async deleteCategory(categoryId: TCategory['id']): Promise<boolean> {
    const record = await pb.collection(PocketBaseCollection.CATEGORY).delete(categoryId);
    return record;
  }

  /**
   * Retrieves the list of categories from the database.
   * @returns A promise that resolves to an array of TCategory objects.
   * @throws If there is an error parsing the retrieved records.
   */
  static async getCategories(): Promise<TCategory[]> {
    const records = await pb.collection(PocketBaseCollection.CATEGORY).getFullList();

    const parsingResult = z.array(ZCategory).safeParse(records);
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
    categories: TCategory[],
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
        frequency: categoryFrequencyMap[category.id] || -1,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .map(({id, name}) => ({
        label: name,
        id: id,
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
}
