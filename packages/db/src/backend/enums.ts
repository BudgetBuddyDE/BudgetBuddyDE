import {backendSchema} from './schema';

export const budgetType = backendSchema.enum('budget_type', ['i', 'e']);
export const categoryType = backendSchema.enum('category_type', ['income', 'expense', 'both']);
export const paymentMethodType = backendSchema.enum('payment_method_type', ['cash', 'bank', 'card', 'wallet', 'other']);
export const paymentMethodStatus = backendSchema.enum('payment_method_status', ['active', 'inactive']);
export const recurringInterval = backendSchema.enum('recurring_interval', ['monthly', 'quarterly', 'yearly']);
