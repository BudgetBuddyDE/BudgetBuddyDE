'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Download, Eye, FileImage, Trash2, UploadCloud} from 'lucide-react';
import Image from 'next/image';
import {useCallback, useEffect, useRef, useState} from 'react';
import {apiClient} from '@/apiClient';
import {StatePanel} from '@/components/shared';
import {Button, ConfirmDialog, DialogShell} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {useI18n} from '@/lib/i18n';

export const ATTACHMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = 'image/png,image/jpg,image/jpeg,image/webp,image/heic,image/heif';
const ALLOWED_TYPES = new Set(ATTACHMENT_ACCEPT.split(','));

interface UploadFileState {
  file: File;
  status: 'ready' | 'uploading' | 'success' | 'error';
  message?: string;
  retryable?: boolean;
}

export function TransactionAttachments({transactionId, onChanged}: {transactionId: string; onChanged?: () => void}) {
  const {t, formatDate} = useI18n();
  const {reload: reloadFinance} = useFinance();
  const [items, setItems] = useState<TAttachmentWithUrl[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<UploadFileState[]>([]);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<TAttachmentWithUrl | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const [response, requestError] = await apiClient.backend.transaction.getTransactionAttachments(transactionId, {
      from: 0,
      to: 99,
      ttl: 300 as never,
    });
    if (requestError || !response) {
      setError(requestError instanceof Error ? requestError.message : t('attachment.error.load'));
      setStatus('error');
      return;
    }
    setItems((response.data ?? []) as TAttachmentWithUrl[]);
    setStatus('success');
  }, [t, transactionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectFiles = (files: readonly File[]) => {
    const next = files.map<UploadFileState>(file => {
      if (!ALLOWED_TYPES.has(file.type)) return {file, status: 'error', message: t('attachment.error.type')};
      if (file.size > ATTACHMENT_MAX_FILE_SIZE) return {file, status: 'error', message: t('attachment.error.size')};
      return {file, status: 'ready'};
    });
    setQueue(next);
  };

  const upload = async () => {
    const readyFiles = queue.filter(item => item.status === 'ready' || (item.status === 'error' && item.retryable));
    for (const queued of readyFiles) {
      setQueue(current =>
        current.map(item =>
          item.file === queued.file ? {...item, status: 'uploading', message: undefined, retryable: false} : item,
        ),
      );
      const [, requestError] = await apiClient.backend.transaction.uploadTransactionAttachments(transactionId, [
        queued.file,
      ]);
      setQueue(current =>
        current.map(item =>
          item.file === queued.file
            ? requestError
              ? {
                  ...item,
                  status: 'error',
                  message: requestError instanceof Error ? requestError.message : t('attachment.error.upload'),
                  retryable: true,
                }
              : {...item, status: 'success', message: t('attachment.uploaded'), retryable: false}
            : item,
        ),
      );
    }
    await load();
    await reloadFinance(true);
    onChanged?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = async (attachmentId: string) => {
    const [, requestError] = await apiClient.backend.attachment.deleteById(attachmentId as never);
    if (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('attachment.error.delete'));
      return;
    }
    await load();
    await reloadFinance(true);
    onChanged?.();
  };

  const readyCount = queue.filter(
    item => item.status === 'ready' || (item.status === 'error' && item.retryable),
  ).length;
  const uploading = queue.some(item => item.status === 'uploading');
  return (
    <section className="transaction-attachments" aria-label={t('attachment.transactionAttachments')}>
      <div className="subsection-heading">
        <div>
          <h3>{t('attachment.title')}</h3>
          <p>{t('attachment.constraints')}</p>
        </div>
        <strong>{items.length}</strong>
      </div>
      <div
        className={`drop-zone${dragging ? ' dragging' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={t('attachment.addFiles')}
        onClick={() => inputRef.current?.click()}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragEnter={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          selectFiles([...event.dataTransfer.files]);
        }}
      >
        <UploadCloud size={28} aria-hidden="true" />
        <strong>{t('attachment.drop')}</strong>
        <span>{t('attachment.choose')}</span>
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          onChange={event => selectFiles([...(event.target.files ?? [])])}
          onClick={event => event.stopPropagation()}
        />
      </div>
      {queue.length > 0 && (
        <div className="upload-queue" aria-label={t('attachment.queue')}>
          {queue.map(item => (
            <div key={`${item.file.name}-${item.file.lastModified}`} className={`upload-file upload-${item.status}`}>
              <FileImage size={16} aria-hidden="true" />
              <span>
                <strong>{item.file.name}</strong>
                <small role={item.status === 'error' ? 'alert' : undefined}>
                  {item.message ?? t(`attachment.status.${item.status}`)}
                </small>
              </span>
              {item.status === 'uploading' && (
                <progress aria-label={t('attachment.uploading', {name: item.file.name})} />
              )}
            </div>
          ))}
          <Button onClick={() => void upload()} disabled={readyCount === 0 || uploading}>
            {uploading
              ? t('attachment.status.uploading')
              : t(readyCount === 1 ? 'attachment.uploadOne' : 'attachment.uploadMany', {count: readyCount})}
          </Button>
        </div>
      )}
      {status === 'loading' && items.length === 0 ? (
        <StatePanel state="loading" />
      ) : status === 'error' ? (
        <StatePanel state="error" description={error ?? undefined} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <StatePanel
          state="empty"
          title={t('attachment.emptyTransaction')}
          description={t('attachment.emptyTransactionDescription')}
        />
      ) : (
        <div className="transaction-attachment-list">
          {items.map(item => (
            <article key={item.id}>
              <button onClick={() => setPreview(item)} aria-label={t('attachment.preview', {name: item.fileName})}>
                <Eye size={16} aria-hidden="true" />
                <span>
                  <strong>{item.fileName}</strong>
                  <small>{formatDate(item.createdAt)}</small>
                </span>
              </button>
              <a
                href={item.signedUrl}
                download={item.fileName}
                aria-label={t('attachment.download', {name: item.fileName})}
              >
                <Download size={16} aria-hidden="true" />
              </a>
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="icon" aria-label={t('attachment.delete', {name: item.fileName})}>
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                }
                title={t('attachment.deleteTitle', {name: item.fileName})}
                description={t('attachment.removeFromTransaction')}
                confirmLabel={t('attachment.deleteFile')}
                onConfirm={() => remove(item.id)}
              />
            </article>
          ))}
        </div>
      )}
      <DialogShell
        open={Boolean(preview)}
        onOpenChange={open => !open && setPreview(null)}
        title={preview?.fileName ?? t('attachment.previewTitle')}
      >
        {preview && (
          <div className="lightbox">
            <Image
              src={preview.signedUrl}
              alt={t('attachment.previewAlt', {name: preview.fileName})}
              width={1200}
              height={900}
              unoptimized
            />
          </div>
        )}
      </DialogShell>
    </section>
  );
}
