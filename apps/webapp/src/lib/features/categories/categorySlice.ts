import {Backend} from '@/services/Backend';
import {createEntitySlice} from '../createEntitySlice';

export const categorySlice = createEntitySlice('category', query => Backend.category.getAll(query));
