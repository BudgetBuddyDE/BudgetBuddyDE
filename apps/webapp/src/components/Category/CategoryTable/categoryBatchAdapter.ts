'use client';

import {
  CreateOrUpdateCategoryPayload,
  type TCategory,
  type TCreateOrUpdateCategoryPayload,
} from '@budgetbuddyde/api/category';
import type {GridColDef} from '@mui/x-data-grid';
import type {BatchEntityDialogProps} from '@/components/Table/BatchEntityDialog';

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

const createDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `category-draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const createEmptyRow = (): DraftRow => ({
  id: createDraftId(),
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
>['mapRowsToPayload'] = rows => {
  const issues: Array<{rowId: DraftRow['id']; message: string}> = [];
  const payload: TCreateOrUpdateCategoryPayload[] = [];

  for (const row of rows) {
    const parsed = categoryDraftSchema.safeParse({
      name: row.name,
      description: row.description && row.description.length > 0 ? row.description : null,
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
