'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {ExternalLink, Trash2} from 'lucide-react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {FeedbackPanel} from '@/components/feedback-panel';
import {Pagination} from '@/components/pagination';
import {Button} from '@/components/ui/button';
import {deleteAttachment} from '@/lib/attachment-mutations';
import {formatDate} from '@/utils/date';

export function AttachmentWorkspace({
  initialAttachments,
  totalCount,
  page,
  pageSize,
  error,
}: {
  initialAttachments: TAttachmentWithUrl[];
  totalCount: number;
  page: number;
  pageSize: number;
  error?: string;
}) {
  const router = useRouter();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [deleting, setDeleting] = useState<TAttachmentWithUrl>();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string>();
  useEffect(() => setAttachments(initialAttachments), [initialAttachments]);
  const navigate = (nextPage: number, nextPageSize = pageSize) =>
    router.push(`/attachments?page=${nextPage}&pageSize=${nextPageSize}`);
  const remove = async () => {
    if (!deleting) return;
    setPending(true);
    const success = await deleteAttachment(deleting.id);
    setPending(false);
    if (!success) {
      setStatus('The attachment could not be deleted.');
      return;
    }
    setAttachments(current => current.filter(item => item.id !== deleting.id));
    setDeleting(undefined);
    router.refresh();
  };
  if (error)
    return (
      <FeedbackPanel
        kind="error"
        title="Attachments unavailable"
        description={error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Attachments are uploaded from a transaction. Signed previews expire after five minutes and are never shared
        between users.
      </p>
      {status ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {status}
        </p>
      ) : null}
      {attachments.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attachments.map(attachment => (
            <article key={attachment.id} className="overflow-hidden rounded-xl border bg-card">
              <Image
                unoptimized
                src={attachment.signedUrl}
                alt={attachment.fileName}
                width={480}
                height={320}
                className="aspect-[3/2] w-full object-cover"
              />
              <div className="p-3">
                <h2 className="truncate text-sm font-medium" title={attachment.fileName}>
                  {attachment.fileName}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(attachment.createdAt)} · {attachment.contentType}
                </p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={attachment.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    referrerPolicy="no-referrer"
                    aria-label={`Open ${attachment.fileName}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                    Open
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
        <FeedbackPanel kind="empty" title="No attachments" description="Open a transaction and add a receipt image." />
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={nextPage => navigate(nextPage)}
        onPageSizeChange={nextSize => navigate(1, nextSize)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete attachment?"
        description="This permanently removes the receipt image. The transaction remains."
        confirmLabel="Delete attachment"
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}
