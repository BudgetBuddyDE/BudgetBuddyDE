export type EntityKind = 'transactions' | 'categories' | 'payment-methods' | 'recurring' | 'budgets';

export interface CategoryView {
  id: string;
  name: string;
  description: string | null;
}

export interface PaymentMethodView {
  id: string;
  name: string;
  provider: string;
  address: string;
  description: string | null;
}

export interface TransactionView {
  id: string;
  processedAt: Date;
  receiver: string;
  transferAmount: number;
  information: string | null;
  categoryId: string;
  categoryName: string;
  paymentMethodId: string;
  paymentMethodName: string;
  attachmentCount: number;
}

export interface RecurringPaymentView {
  id: string;
  executeAt: number;
  interval: 'monthly' | 'quarterly' | 'yearly';
  nextExecutionAt: Date;
  paused: boolean;
  receiver: string;
  transferAmount: number;
  information: string | null;
  categoryId: string;
  categoryName: string;
  paymentMethodId: string;
  paymentMethodName: string;
}

export interface BudgetView {
  id: string;
  type: 'i' | 'e';
  name: string;
  description: string | null;
  budget: number;
  balance: number;
  categoryIds: string[];
  categoryNames: string[];
}

export interface FinanceData {
  categories: CategoryView[];
  paymentMethods: PaymentMethodView[];
  transactions: TransactionView[];
  recurring: RecurringPaymentView[];
  budgets: BudgetView[];
}

export interface CategoryInput {
  name: string;
  description?: string;
}

export interface PaymentMethodInput {
  name: string;
  provider: string;
  address: string;
  description?: string;
}

export interface TransactionInput {
  processedAt: Date;
  receiver: string;
  transferAmount: number;
  information?: string;
  categoryId: string;
  paymentMethodId: string;
}

export interface RecurringPaymentInput {
  executeAt: number;
  interval: 'monthly' | 'quarterly' | 'yearly';
  paused: boolean;
  receiver: string;
  transferAmount: number;
  information?: string;
  categoryId: string;
  paymentMethodId: string;
}

export interface BudgetInput {
  type: 'i' | 'e';
  name: string;
  description?: string;
  budget: number;
  categories: string[];
}

export type EntityInput = CategoryInput | PaymentMethodInput | TransactionInput | RecurringPaymentInput | BudgetInput;

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
