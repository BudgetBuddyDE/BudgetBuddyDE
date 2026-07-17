'use client';

import type {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  impact,
  confirmLabel,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  impact?: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      {impact ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">{impact}</div>
      ) : null}
    </DialogShell>
  );
}
