import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TCreateOrUpdateTransactionPayload} from '@budgetbuddyde/api/transaction';
import {apiClient} from '@/apiClient';
import {validateTransactionDraft} from '@/lib/transaction-form';
import type {TransactionDraft, TransactionDraftErrors} from '@/types/transaction';

export interface SaveTransactionsResult {
  saved: number;
  failed: number;
  validationErrors: Record<number, TransactionDraftErrors>;
}

async function resolveUncategorizedCategory(
  drafts: TransactionDraft[],
  categories: TCategoryVH[],
): Promise<string | null> {
  if (!drafts.some(draft => !draft.categoryId)) return null;
  const existing = categories.find(category => category.name.toLocaleLowerCase() === 'uncategorized');
  if (existing) return existing.id;
  const [created, error] = await apiClient.backend.category.create({
    name: 'Uncategorized',
    type: 'both',
    color: '#64748b',
    icon: 'circle-help',
    budgetTarget: null,
    description: 'Transactions awaiting classification',
  });
  if (error || !created?.data?.[0]) return null;
  return created.data[0].id;
}

export async function saveTransactions(
  drafts: TransactionDraft[],
  categories: TCategoryVH[],
): Promise<SaveTransactionsResult> {
  const validationErrors: Record<number, TransactionDraftErrors> = {};
  const validated = drafts.map((draft, index) => {
    const result = validateTransactionDraft(draft);
    if (result.errors) validationErrors[index] = result.errors;
    return result.data;
  });
  if (Object.keys(validationErrors).length) return {saved: 0, failed: drafts.length, validationErrors};

  const uncategorizedId = await resolveUncategorizedCategory(drafts, categories);
  if (drafts.some(draft => !draft.categoryId) && !uncategorizedId)
    return {saved: 0, failed: drafts.length, validationErrors};

  const results = await Promise.all(
    validated.map(async data => {
      if (!data) return false;
      const payload: TCreateOrUpdateTransactionPayload = {
        categoryId: (data.categoryId || uncategorizedId) as TCreateOrUpdateTransactionPayload['categoryId'],
        paymentMethodId: data.paymentMethodId as TCreateOrUpdateTransactionPayload['paymentMethodId'],
        processedAt: data.processedAt,
        receiver: data.receiver,
        transferAmount: data.transferAmount,
        information: data.information,
      };
      const [, error] = data.id
        ? await apiClient.backend.transaction.updateById(data.id, payload)
        : await apiClient.backend.transaction.create(payload);
      return !error;
    }),
  );
  const saved = results.filter(Boolean).length;
  return {saved, failed: results.length - saved, validationErrors};
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const [, error] = await apiClient.backend.transaction.deleteById(id);
  return !error;
}
