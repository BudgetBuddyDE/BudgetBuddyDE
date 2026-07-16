'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Download, Eye, FileImage, Plus, Trash2, UploadCloud} from 'lucide-react';
import Image from 'next/image';
import {useSearchParams} from 'next/navigation';
import {useCallback, useEffect, useRef, useState} from 'react';
import {apiClient} from '@/apiClient';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {Button, ConfirmDialog, DialogShell, SelectField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {formatDate} from '@/utils/format';

const BATCH_SIZE = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']);

export function Attachments() {
  const {data} = useFinance();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<TAttachmentWithUrl[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TAttachmentWithUrl | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (append = false) => {
      setStatus('loading');
      setError(null);
      const from = append ? items.length : 0;
      const [response, requestError] = await apiClient.backend.transaction.getAllTransactionAttachments({
        from,
        to: from + BATCH_SIZE - 1,
        ttl: 300 as never,
      });
      if (requestError || !response) {
        setError(requestError instanceof Error ? requestError.message : 'Attachments could not be loaded.');
        setStatus('error');
        return;
      }
      const nextItems = (response.data ?? []) as TAttachmentWithUrl[];
      setItems(current => (append ? [...current, ...nextItems] : nextItems));
      setTotal(response.totalCount ?? nextItems.length);
      setStatus('success');
    },
    [items.length],
  );

  useEffect(() => {
    void load(false);
  }, []);
  useEffect(() => {
    if (searchParams.get('intent') === 'upload') setUploadOpen(true);
  }, [searchParams]);

  const upload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const files = [...(fileRef.current?.files ?? [])];
    setUploadError(null);
    if (!transactionId) {
      setUploadError('Choose the transaction these files belong to.');
      return;
    }
    if (files.length === 0) {
      setUploadError('Choose at least one image.');
      return;
    }
    const invalid = files.find(file => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      setUploadError(`${invalid.name} is not a supported image or is larger than 10 MB.`);
      return;
    }
    setUploading(true);
    const [, requestError] = await apiClient.backend.transaction.uploadTransactionAttachments(transactionId, files);
    setUploading(false);
    if (requestError) {
      setUploadError(requestError instanceof Error ? requestError.message : 'Upload failed.');
      return;
    }
    setUploadOpen(false);
    await load(false);
  };

  const remove = async (attachmentId: string) => {
    const [, requestError] = await apiClient.backend.attachment.deleteById(attachmentId as never);
    if (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The attachment could not be deleted.');
      return;
    }
    await load(false);
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Receipts"
        title="Attachments"
        description="Your transaction documents, protected by short-lived signed links."
        action={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={17} /> Upload files
          </Button>
        }
      />
      <section className="attachment-toolbar">
        <div>
          <strong>{total} files</strong>
          <span>Images · newest first</span>
        </div>
        <BadgeInfo />
      </section>
      {status === 'loading' && items.length === 0 ? (
        <SkeletonRows count={8} />
      ) : status === 'error' ? (
        <StatePanel state="error" description={error ?? undefined} onRetry={() => void load(false)} />
      ) : items.length === 0 ? (
        <StatePanel
          state="empty"
          title="No receipts uploaded"
          description="Attach an image to a transaction to keep records together."
        />
      ) : (
        <>
          <section className="attachment-grid" aria-label="Attachment gallery">
            {items.map(item => (
              <article key={item.id} className="attachment-card">
                <button
                  className="attachment-preview"
                  onClick={() => setPreview(item)}
                  aria-label={`Preview ${item.fileName}`}
                >
                  <Image src={item.signedUrl} alt="" fill sizes="(max-width: 700px) 50vw, 260px" unoptimized />
                  <span>
                    <Eye size={17} /> Preview
                  </span>
                </button>
                <div className="attachment-meta">
                  <span className="file-icon">
                    <FileImage size={18} />
                  </span>
                  <span>
                    <strong title={item.fileName}>{item.fileName}</strong>
                    <small>{formatDate(item.createdAt)}</small>
                  </span>
                  <div className="attachment-actions">
                    <a href={item.signedUrl} download={item.fileName} aria-label={`Download ${item.fileName}`}>
                      <Download size={16} />
                    </a>
                    <ConfirmDialog
                      trigger={
                        <button aria-label={`Delete ${item.fileName}`}>
                          <Trash2 size={16} />
                        </button>
                      }
                      title={`Delete ${item.fileName}?`}
                      description="The receipt will be removed from the transaction and cannot be recovered."
                      confirmLabel="Delete file"
                      onConfirm={() => remove(item.id)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </section>
          {items.length < total && (
            <div className="load-more">
              <Button variant="secondary" onClick={() => void load(true)} disabled={status === 'loading'}>
                {status === 'loading' ? 'Loading…' : 'Load more'}
              </Button>
              <span>
                {items.length} of {total}
              </span>
            </div>
          )}
        </>
      )}
      <DialogShell
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload attachments"
        description="PNG, JPEG, WebP, HEIC, or HEIF. Maximum 10 MB per file."
      >
        <form className="entity-form" onSubmit={event => void upload(event)}>
          <SelectField
            label="Transaction"
            value={transactionId}
            onChange={event => setTransactionId(event.target.value)}
            required
          >
            <option value="">Choose transaction</option>
            {data.transactions.map(item => (
              <option key={item.id} value={item.id}>
                {item.receiver} · {formatDate(item.processedAt)}
              </option>
            ))}
          </SelectField>
          <label className="drop-zone">
            <UploadCloud size={28} />
            <strong>Choose receipt images</strong>
            <span>or drag files into this area</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/webp,image/heic,image/heif"
              multiple
            />
          </label>
          {uploadError && (
            <div className="form-error" role="alert">
              {uploadError}
            </div>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogShell>
      <DialogShell
        open={Boolean(preview)}
        onOpenChange={open => !open && setPreview(null)}
        title={preview?.fileName ?? 'Attachment preview'}
      >
        {preview && (
          <div className="lightbox">
            <Image
              src={preview.signedUrl}
              alt={`Preview of ${preview.fileName}`}
              width={1200}
              height={900}
              unoptimized
            />
          </div>
        )}
      </DialogShell>
    </div>
  );
}

function BadgeInfo() {
  return <span className="privacy-badge">Private · signed URLs expire after 5 min</span>;
}
