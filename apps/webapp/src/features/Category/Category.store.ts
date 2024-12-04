import {type TCategory} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';

import {CategoryService} from './CategoryService';

export const useCategoryStore = GenerateGenericStore<TCategory[]>(() => CategoryService.getCategories());
