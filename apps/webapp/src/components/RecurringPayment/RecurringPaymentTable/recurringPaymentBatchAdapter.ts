'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {
  CreateOrUpdateRecurringPaymentPayload,
  type TCreateOrUpdateRecurringPaymentPayload,
  type TExecutionPlan,
  type TExpandedRecurringPayment,
} from '@budgetbuddyde/api/recurringPayment';
import type {GridColDef} from '@mui/x-data-grid';
import {formatLocalDateOnly, parseLocalDateOnly} from '@/components/RecurringPayment/dateOnly';
import {executionPlanOptions} from '@/components/RecurringPayment/executionPlan';
import type {BatchEntityDialogProps} from '@/components/Table/BatchEntityDialog';
import {mapDraftRowsToPayload} from '@/components/Table/BatchEntityDialog/mapRowsToPayload';
export type RecurringPaymentDraftRow = {
  id: string;
  executionPlan: TExecutionPlan;
  startsOn: Date;
  paused: boolean;
  categoryId: string;
  paymentMethodId: string;
  receiver: string;
  transferAmount: number;
  information: string | null;
};

export type DraftRow = RecurringPaymentDraftRow;

const recurringPaymentDraftSchema = CreateOrUpdateRecurringPaymentPayload.extend({
  categoryId: CreateOrUpdateRecurringPaymentPayload.shape.categoryId,
  paymentMethodId: CreateOrUpdateRecurringPaymentPayload.shape.paymentMethodId,
  receiver: CreateOrUpdateRecurringPaymentPayload.shape.receiver.min(1).max(100),
  transferAmount: CreateOrUpdateRecurringPaymentPayload.shape.transferAmount.finite(),
});

export const createEmptyRow = (): DraftRow => ({
  id: crypto.randomUUID(),
  executionPlan: 'monthly',
  startsOn: new Date(),
  paused: false,
  categoryId: '',
  paymentMethodId: '',
  receiver: '',
  transferAmount: 0,
  information: null,
});

export const fromEntity = (entity: TExpandedRecurringPayment): DraftRow => ({
  id: entity.id,
  executionPlan: entity.executionPlan,
  startsOn: parseLocalDateOnly(entity.startsOn),
  paused: entity.paused,
  categoryId: entity.category.id,
  paymentMethodId: entity.paymentMethod.id,
  receiver: entity.receiver,
  transferAmount: entity.transferAmount,
  information: entity.information,
});

export type RecurringPaymentBatchColumnOptions = {
  categories: readonly Pick<TCategoryVH, 'id' | 'name'>[];
  paymentMethods: readonly Pick<TPaymentMethodVH, 'id' | 'name'>[];
};

export const columns = (options: RecurringPaymentBatchColumnOptions): GridColDef<DraftRow>[] => [
  {
    field: 'executionPlan',
    headerName: 'Plan',
    type: 'singleSelect',
    valueOptions: executionPlanOptions,
    flex: 1,
    minWidth: 160,
    editable: true,
  },
  {
    field: 'startsOn',
    headerName: 'First execution date',
    type: 'date',
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'paused',
    headerName: 'Paused',
    type: 'boolean',
    flex: 1,
    minWidth: 120,
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
  TCreateOrUpdateRecurringPaymentPayload
>['mapRowsToPayload'] = rows =>
  mapDraftRowsToPayload(
    rows,
    recurringPaymentDraftSchema,
    row => ({
      executionPlan: row.executionPlan,
      startsOn: formatLocalDateOnly(row.startsOn),
      paused: row.paused,
      categoryId: row.categoryId,
      paymentMethodId: row.paymentMethodId,
      receiver: row.receiver,
      transferAmount: row.transferAmount,
      information: row.information && row.information.length > 0 ? row.information : null,
    }),
    row =>
      !(row.startsOn instanceof Date) || Number.isNaN(row.startsOn.getTime())
        ? 'First execution date is required'
        : undefined,
  );
