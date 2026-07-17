'use client';

import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';

export interface IntentOption {
  id: string;
  label: string;
  description?: string;
}

export function IntentObjectPicker({
  open,
  title,
  options,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  options: IntentOption[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <DialogShell
      open={open}
      onOpenChange={next => !next && onClose()}
      title={title}
      description="Multiple objects match this intent. Select exactly one to continue."
      footer={
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div className="space-y-2">
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="block w-full rounded-md border p-3 text-left hover:bg-accent"
          >
            <span className="block text-sm font-medium">{option.label}</span>
            {option.description ? (
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            ) : null}
          </button>
        ))}
      </div>
    </DialogShell>
  );
}
