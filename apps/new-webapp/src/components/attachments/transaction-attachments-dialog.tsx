'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {ExternalLink, Trash2, Upload} from 'lucide-react';
import Image from 'next/image';
import {useEffect, useState} from 'react';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {
  deleteTransactionAttachment,
  loadTransactionAttachments,
  uploadTransactionAttachments,
} from '@/lib/attachment-mutations';

export function TransactionAttachmentsDialog({
  transaction,
  onOpenChange,
  onChanged,
}: {
  transaction?: TExpandedTransaction;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const [attachments, setAttachments] = useState<TAttachmentWithUrl[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [deleting, setDeleting] = useState<TAttachmentWithUrl>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (!transaction) return;
    let current = true;
    setPending(true);
    void loadTransactionAttachments(transaction.id).then(result => {
      if (!current) return;
      setAttachments(result.attachments);
      setError(result.error);
      setPending(false);
    });
    return () => {
      current = false;
    };
  }, [transaction]);
  const upload = async () => {
    if (!transaction) return;
    setPending(true);
    const result = await uploadTransactionAttachments(transaction.id, files);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAttachments(current => [
      ...current,
      ...result.attachments.filter(item => !current.some(existing => existing.id === item.id)),
    ]);
    setFiles([]);
    setError(undefined);
    onChanged?.();
  };
  const remove = async () => {
    if (!transaction || !deleting) return;
    setPending(true);
    const success = await deleteTransactionAttachment(transaction.id, deleting.id);
    setPending(false);
    if (!success) {
      setError('The attachment could not be deleted.');
      return;
    }
    setAttachments(current => current.filter(item => item.id !== deleting.id));
    setDeleting(undefined);
    onChanged?.();
  };
  return (
    <>
      <DialogShell
        open={Boolean(transaction)}
        onOpenChange={onOpenChange}
        title={`Attachments${transaction ? ` · ${transaction.receiver}` : ''}`}
        description="Receipt images are private. Preview links expire after five minutes."
        footer={
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-md border border-dashed p-4">
            <label className="text-sm font-medium" htmlFor="transaction-attachment-files">
              Add receipt images
            </label>
            <input
              id="transaction-attachment-files"
              className="mt-2 block w-full text-sm"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              onChange={event => setFiles(Array.from(event.target.files ?? []))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Up to 10 files, 20 MB each.</p>
            <Button className="mt-3" size="sm" disabled={pending || !files.length} onClick={upload}>
              <Upload aria-hidden="true" className="size-4" />
              Upload {files.length || ''}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {pending && !attachments.length ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading attachments…
            </p>
          ) : attachments.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {attachments.map(attachment => (
                <article key={attachment.id} className="overflow-hidden rounded-md border">
                  <Image
                    unoptimized
                    src={attachment.signedUrl}
                    alt={attachment.fileName}
                    width={240}
                    height={160}
                    className="aspect-[3/2] w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="truncate text-xs" title={attachment.fileName}>
                      {attachment.fileName}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <a
                        href={attachment.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        referrerPolicy="no-referrer"
                        aria-label={`Open ${attachment.fileName}`}
                        className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent"
                      >
                        <ExternalLink aria-hidden="true" className="size-4" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${attachment.fileName}`}
                        onClick={() => setDeleting(attachment)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attachments on this transaction.</p>
          )}
        </div>
      </DialogShell>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete attachment?"
        description="The receipt image will be permanently removed."
        confirmLabel="Delete attachment"
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}
