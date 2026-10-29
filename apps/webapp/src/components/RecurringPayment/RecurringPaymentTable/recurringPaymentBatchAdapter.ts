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
  labels: {
    executionPlan: string;
    startsOn: string;
    paused: string;
    category: string;
    paymentMethod: string;
    receiver: string;
    amount: string;
    information: string;
  };
  executionPlanOptions: Array<{value: TExecutionPlan; label: string}>;
};

export const columns = ({
  categories,
  paymentMethods,
  labels,
  executionPlanOptions,
}: RecurringPaymentBatchColumnOptions): GridColDef<DraftRow>[] => [
  {
    field: 'executionPlan',
    headerName: labels.executionPlan,
    type: 'singleSelect',
    valueOptions: executionPlanOptions,
    flex: 1,
    minWidth: 160,
    editable: true,
  },
  {
    field: 'startsOn',
    headerName: labels.startsOn,
    type: 'date',
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'paused',
    headerName: labels.paused,
    type: 'boolean',
    flex: 1,
    minWidth: 120,
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

export const mapRowsToPayload = (
  rows: DraftRow[],
  startsOnValidationMessage: string,
): ReturnType<
  NonNullable<BatchEntityDialogProps<DraftRow, TCreateOrUpdateRecurringPaymentPayload>['mapRowsToPayload']>
> =>
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
      !(row.startsOn instanceof Date) || Number.isNaN(row.startsOn.getTime()) ? startsOnValidationMessage : undefined,
  );
