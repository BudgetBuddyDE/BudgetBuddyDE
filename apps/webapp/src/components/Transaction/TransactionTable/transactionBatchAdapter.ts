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
import {mapDraftRowsToPayload} from '@/components/Table/BatchEntityDialog/mapRowsToPayload';

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

export const createEmptyRow = (): DraftRow => ({
  id: crypto.randomUUID(),
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
  labels: {
    processedAt: string;
    category: string;
    paymentMethod: string;
    receiver: string;
    amount: string;
    information: string;
  };
};

export const columns = ({
  categories,
  paymentMethods,
  labels,
}: TransactionBatchColumnOptions): GridColDef<DraftRow>[] => [
  {
    field: 'processedAt',
    headerName: labels.processedAt,
    type: 'date',
    flex: 1,
    minWidth: 160,
    editable: true,
  },
  {
    field: 'categoryId',
    headerName: labels.category,
    type: 'singleSelect',
    valueOptions: categories.map(category => ({value: category.id, label: category.name})),
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'paymentMethodId',
    headerName: labels.paymentMethod,
    type: 'singleSelect',
    valueOptions: paymentMethods.map(paymentMethod => ({
      value: paymentMethod.id,
      label: paymentMethod.name,
    })),
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'receiver',
    headerName: labels.receiver,
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'transferAmount',
    headerName: labels.amount,
    type: 'number',
    flex: 1,
    minWidth: 140,
    editable: true,
  },
  {
    field: 'information',
    headerName: labels.information,
    flex: 2,
    minWidth: 240,
    editable: true,
  },
];

export const mapRowsToPayload: BatchEntityDialogProps<
  DraftRow,
  TCreateOrUpdateTransactionPayload
>['mapRowsToPayload'] = rows =>
  mapDraftRowsToPayload(rows, transactionDraftSchema, row => ({
    processedAt: row.processedAt,
    categoryId: row.categoryId,
    paymentMethodId: row.paymentMethodId,
    receiver: row.receiver,
    transferAmount: row.transferAmount,
    information: row.information && row.information.length > 0 ? row.information : null,
  }));
