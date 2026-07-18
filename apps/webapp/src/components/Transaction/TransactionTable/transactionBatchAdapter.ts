'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {
  CreateOrUpdateTransactionPayload,
  type TCreateOrUpdateTransactionPayload,
  type TExpandedTransaction,
} from '@budgetbuddyde/api/transaction';
import type {GridColDef} from '@mui/x-data-grid';
import {z} from 'zod';
import type {BatchEntityDialogProps} from '@/components/Table/BatchEntityDialog';

export type TransactionDraftRow = {
  id: string;
  processedAt: Date;
  categoryId: string;
  paymentMethodId: string;
  receiver: string;
  transferAmount: number;
  information: string | null;
};

export type DraftRow = TransactionDraftRow;

const transactionDraftSchema = CreateOrUpdateTransactionPayload.extend({
  processedAt: z.date(),
  categoryId: CreateOrUpdateTransactionPayload.shape.categoryId,
  paymentMethodId: CreateOrUpdateTransactionPayload.shape.paymentMethodId,
  receiver: CreateOrUpdateTransactionPayload.shape.receiver.min(1).max(100),
  transferAmount: CreateOrUpdateTransactionPayload.shape.transferAmount.finite(),
});

const createDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `transaction-draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createEmptyRow = (): DraftRow => ({
  id: createDraftId(),
  processedAt: new Date(),
  categoryId: '',
  paymentMethodId: '',
  receiver: '',
  transferAmount: 0,
  information: null,
});

export const fromEntity = (entity: TExpandedTransaction): DraftRow => ({
  id: entity.id,
  processedAt: entity.processedAt instanceof Date ? new Date(entity.processedAt) : new Date(entity.processedAt),
  categoryId: entity.category.id,
  paymentMethodId: entity.paymentMethod.id,
  receiver: entity.receiver,
  transferAmount: entity.transferAmount,
  information: entity.information,
});

export type TransactionBatchColumnOptions = {
  categories: readonly Pick<TCategoryVH, 'id' | 'name'>[];
  paymentMethods: readonly Pick<TPaymentMethodVH, 'id' | 'name'>[];
};

export const columns = (options: TransactionBatchColumnOptions): GridColDef<DraftRow>[] => [
  {
    field: 'processedAt',
    headerName: 'Date',
    type: 'date',
    flex: 1,
    minWidth: 160,
    editable: true,
  },
  {
    field: 'categoryId',
    headerName: 'Category',
    type: 'singleSelect',
    valueOptions: options.categories.map(category => ({value: category.id, label: category.name})),
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'paymentMethodId',
    headerName: 'Payment method',
    type: 'singleSelect',
    valueOptions: options.paymentMethods.map(paymentMethod => ({
      value: paymentMethod.id,
      label: paymentMethod.name,
    })),
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'receiver',
    headerName: 'Receiver',
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'transferAmount',
    headerName: 'Amount',
    type: 'number',
    flex: 1,
    minWidth: 140,
    editable: true,
  },
  {
    field: 'information',
    headerName: 'Information',
    flex: 2,
    minWidth: 240,
    editable: true,
  },
];

export const mapRowsToPayload: BatchEntityDialogProps<
  DraftRow,
  TCreateOrUpdateTransactionPayload
>['mapRowsToPayload'] = rows => {
  const issues: Array<{rowId: DraftRow['id']; message: string}> = [];
  const payload: TCreateOrUpdateTransactionPayload[] = [];

  for (const row of rows) {
    const parsed = transactionDraftSchema.safeParse({
      processedAt: row.processedAt,
      categoryId: row.categoryId,
      paymentMethodId: row.paymentMethodId,
      receiver: row.receiver,
      transferAmount: row.transferAmount,
      information: row.information && row.information.length > 0 ? row.information : null,
    });

    if (!parsed.success) {
      issues.push({
        rowId: row.id,
        message: parsed.error.issues.map(issue => issue.message).join(', '),
      });
      continue;
    }

    payload.push(parsed.data);
  }

  return issues.length > 0 ? {success: false, issues} : {success: true, payload};
};
