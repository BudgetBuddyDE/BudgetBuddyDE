import {apiClient} from '@/apiClient';
import {createEntitySlice} from '../createEntitySlice';

export const budgetSlice = createEntitySlice('budget', query => apiClient.backend.budget.getAll(query));
