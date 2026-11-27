import type {TCategoryVH} from '@budgetbuddyde/api/category';
import {apiClient} from '@/apiClient';

export function withCategoryPaths(categories: readonly TCategoryVH[]): TCategoryVH[] {
  const names = new Map(categories.map(({id, name}) => [id, name]));
  return categories.map(category => {
    const parent = category.parentId ? names.get(category.parentId) : undefined;
    return parent ? {...category, name: `${parent} > ${category.name}`} : category;
  });
}

export async function getCategoryOptions() {
  const [categories, error] = await apiClient.backend.category.getValueHelp();
  return categories ? ([withCategoryPaths(categories), null] as const) : ([null, error] as const);
}
