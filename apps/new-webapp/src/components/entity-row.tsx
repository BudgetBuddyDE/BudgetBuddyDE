'use client';

import {Pencil, Play, Trash2} from 'lucide-react';
import {ENTITY_CONFIG, type EntityView} from '@/components/entity-config';
import {ConfirmDialog, IconButton, Tooltip} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import type {EntityKind} from '@/types/finance';

export function EntityRow({
  kind,
  item,
  selected,
  onSelect,
  onEdit,
}: {
  kind: EntityKind;
  item: EntityView;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const {deleteEntity, executeRecurring, mutationPending} = useFinance();
  const config = ENTITY_CONFIG[kind];
  const name = config.name(item);

  return (
    <div className={`data-row data-row-${kind}`} role="row">
      <span className="select-cell">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select ${name}`} />
      </span>
      {config.renderCells(item)}
      <span className="row-actions">
        {kind === 'recurring' && (
          <Tooltip label={`Execute ${name}`}>
            <IconButton
              aria-label={`Execute ${name}`}
              disabled={mutationPending}
              onClick={() => void executeRecurring(item.id)}
            >
              <Play size={16} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip label={`Edit ${name}`}>
          <IconButton aria-label={`Edit ${name}`} onClick={onEdit}>
            <Pencil size={16} />
          </IconButton>
        </Tooltip>
        <ConfirmDialog
          trigger={
            <Tooltip label={`Delete ${name}`}>
              <IconButton aria-label={`Delete ${name}`}>
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          }
          title={`Delete ${name}?`}
          description={`The ${config.meta.singular} and its direct associations will be removed.`}
          confirmLabel="Delete"
          busy={mutationPending}
          onConfirm={async () => {
            await deleteEntity(kind, item.id);
          }}
        />
      </span>
    </div>
  );
}
