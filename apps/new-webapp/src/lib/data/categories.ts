import type {TCategory} from '@budgetbuddyde/api/category';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export interface CategoryPageData {
  categories: TCategory[];
  totalCount: number;
  error?: string;
}

export async function loadCategoryPage(search: string, page: number, pageSize: number): Promise<CategoryPageData> {
  const headers = await getForwardedHeaders();
  const from = (page - 1) * pageSize;
  const [response, error] = await apiClient.backend.category.getAll(
    {search: search || undefined, from, to: from + pageSize},
    {headers, cache: 'no-store'},
  );
  return {
    categories: response?.data ?? [],
    totalCount: response?.totalCount ?? 0,
    error: error ? 'Categories could not be loaded.' : undefined,
  };
}
