'use client';

import {
  CreateOrUpdatePaymentMethodPayload,
  type TCreateOrUpdatePaymentMethodPayload,
  type TPaymentMethod,
} from '@budgetbuddyde/api/paymentMethod';
import type {GridColDef} from '@mui/x-data-grid';
import type {BatchEntityDialogProps} from '@/components/Table/BatchEntityDialog';
import {mapDraftRowsToPayload} from '@/components/Table/BatchEntityDialog/mapRowsToPayload';
import {englishTranslator, type AppTranslator} from '@/i18n/translate';

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

export type PaymentMethodBatchColumnOptions = {t?: AppTranslator};

export const columns = ({t = englishTranslator}: PaymentMethodBatchColumnOptions = {}): GridColDef<DraftRow>[] => [
  {
    field: 'name',
    headerName: t('paymentMethods.name'),
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'provider',
    headerName: t('paymentMethods.provider'),
    flex: 1,
    minWidth: 180,
    editable: true,
  },
  {
    field: 'address',
    headerName: t('paymentMethods.address'),
    flex: 1,
    minWidth: 220,
    editable: true,
  },
  {
    field: 'description',
    headerName: t('paymentMethods.description'),
    flex: 2,
    minWidth: 240,
    editable: true,
  },
];

export const createMapRowsToPayload =
  (t: AppTranslator): BatchEntityDialogProps<DraftRow, TCreateOrUpdatePaymentMethodPayload>['mapRowsToPayload'] =>
  rows =>
    mapDraftRowsToPayload(
      rows,
      paymentMethodDraftSchema,
      row => ({
        name: row.name,
        provider: row.provider,
        address: row.address,
        description: row.description && row.description.length > 0 ? row.description : null,
      }),
      undefined,
      t,
    );

export const mapRowsToPayload = createMapRowsToPayload(englishTranslator);
