import {type TCategory} from '@budgetbuddyde/types';

export function getCategoryFromList(
  categoryId: TCategory['id'],
  categories: TCategory[],
): {label: TCategory['name']; value: TCategory['id']} | undefined {
  const match = categories.find(category => category.id === categoryId);
  if (!match) return undefined;
  return {label: match.name, value: match.id};
}
