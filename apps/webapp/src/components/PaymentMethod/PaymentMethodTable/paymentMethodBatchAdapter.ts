'use client';

import {
  CreateOrUpdatePaymentMethodPayload,
  type TCreateOrUpdatePaymentMethodPayload,
  type TPaymentMethod,
} from '@budgetbuddyde/api/paymentMethod';
import type {GridColDef} from '@mui/x-data-grid';
import type {BatchEntityDialogProps} from '@/components/Table/BatchEntityDialog';
import {mapDraftRowsToPayload} from '@/components/Table/BatchEntityDialog/mapRowsToPayload';

export type PaymentMethodDraftRow = {
  id: string;
  name: string;
  provider: string;
  address: string;
  description: string | null;
};

export type DraftRow = PaymentMethodDraftRow;

const paymentMethodDraftSchema = CreateOrUpdatePaymentMethodPayload.extend({
  // Match the database varchar limits rather than allowing values the API schema accepts
  // but the backend cannot persist.
  name: CreateOrUpdatePaymentMethodPayload.shape.name.min(1).max(40),
  provider: CreateOrUpdatePaymentMethodPayload.shape.provider.min(1).max(32),
  address: CreateOrUpdatePaymentMethodPayload.shape.address.min(1).max(32),
});

export const createEmptyRow = (): DraftRow => ({
  id: crypto.randomUUID(),
  name: '',
  provider: '',
  address: '',
  description: null,
});

export const fromEntity = (entity: TPaymentMethod): DraftRow => ({
  id: entity.id,
  name: entity.name,
  provider: entity.provider,
  address: entity.address,
  description: entity.description,
});

export type PaymentMethodBatchColumnOptions = Record<never, never>;

export const columns = (_options?: PaymentMethodBatchColumnOptions): GridColDef<DraftRow>[] => [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'provider',
    headerName: 'Provider',
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'address',
    headerName: 'Address',
    flex: 1,
    minWidth: 220,
    editable: true,
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 2,
    minWidth: 240,
    editable: true,
  },
];

export const mapRowsToPayload: BatchEntityDialogProps<
  DraftRow,
  TCreateOrUpdatePaymentMethodPayload
>['mapRowsToPayload'] = rows =>
  mapDraftRowsToPayload(rows, paymentMethodDraftSchema, row => ({
    name: row.name,
    provider: row.provider,
    address: row.address,
    description: row.description && row.description.length > 0 ? row.description : null,
  }));
