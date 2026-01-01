import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const categorySlice = createEntitySlice('category', query => apiClient.backend.category.getAll(query));
