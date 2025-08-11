import { CategoryService } from '@/services/Category.service';
import { createEntitySlice } from '../createEntitySlice';

export const categorySlice = createEntitySlice('category', (query) =>
  CategoryService.getCategoriesWithCount(query)
);
