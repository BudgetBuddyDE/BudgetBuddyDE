import {GenerateGenericStore} from '@/hooks/GenericHook';
import {type TCategory} from '@/newTypes';

import {CategoryService} from './CategoryService';

export const useCategoryStore = GenerateGenericStore<TCategory[]>(() => CategoryService.getCategories());
