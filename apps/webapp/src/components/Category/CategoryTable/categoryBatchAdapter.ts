'use client';

import {
  CreateOrUpdateCategoryPayload,
  type TCategory,
  type TCreateOrUpdateCategoryPayload,
} from '@budgetbuddyde/api/category';
import type {GridColDef} from '@mui/x-data-grid';
import type {BatchEntityDialogProps} from '@/components/Table/BatchEntityDialog';
import {mapDraftRowsToPayload} from '@/components/Table/BatchEntityDialog/mapRowsToPayload';

export type CategoryDraftRow = {
  id: string;
  name: string;
  description: string | null;
};

export type DraftRow = CategoryDraftRow;

const categoryDraftSchema = CreateOrUpdateCategoryPayload.extend({
  // Keep the client-side validation aligned with the database's varchar(40) NOT NULL field.
  name: CreateOrUpdateCategoryPayload.shape.name.min(1).max(40),
});

export const createEmptyRow = (): DraftRow => ({
  id: crypto.randomUUID(),
  name: '',
  description: null,
});

export const fromEntity = (entity: TCategory): DraftRow => ({
  id: entity.id,
  name: entity.name,
  description: entity.description,
});

export type CategoryBatchColumnOptions = Record<never, never>;

export const columns = (_options?: CategoryBatchColumnOptions): GridColDef<DraftRow>[] => [
  {
    field: 'name',
    headerName: 'Name',
    flex: 1,
    minWidth: 180,
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
  TCreateOrUpdateCategoryPayload
>['mapRowsToPayload'] = rows =>
  mapDraftRowsToPayload(rows, categoryDraftSchema, row => ({
    name: row.name,
    description: row.description && row.description.length > 0 ? row.description : null,
  }));
