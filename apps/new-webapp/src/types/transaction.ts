export interface TransactionDraft {
  id?: string;
  amount: string;
  type: 'income' | 'expense';
  date: string;
  categoryId: string;
  paymentMethodId: string;
  receiver: string;
  information: string;
}

export interface TransactionDraftErrors {
  amount?: string;
  date?: string;
  paymentMethodId?: string;
  receiver?: string;
}
