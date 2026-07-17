'use client';

import type {TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Download, Eye, FileImage, Plus, Trash2} from 'lucide-react';
import Image from 'next/image';
import {useSearchParams} from 'next/navigation';
import {useCallback, useEffect, useState} from 'react';
import {apiClient} from '@/apiClient';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {TransactionAttachments} from '@/components/transaction-attachments';
import {Button, ConfirmDialog, DialogShell, SelectField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {useI18n} from '@/lib/i18n';

const BATCH_SIZE = 20;

export function Attachments() {
  const {t, formatDate} = useI18n();
  const {data} = useFinance();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<TAttachmentWithUrl[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TAttachmentWithUrl | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');

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
        setError(requestError instanceof Error ? requestError.message : t('attachment.error.load'));
        setStatus('error');
        return;
      }
      const nextItems = (response.data ?? []) as TAttachmentWithUrl[];
      setItems(current => (append ? [...current, ...nextItems] : nextItems));
      setTotal(response.totalCount ?? nextItems.length);
      setStatus('success');
    },
    [items.length, t],
  );

  useEffect(() => {
    void load(false);
  }, []);
  useEffect(() => {
    if (searchParams.get('intent') === 'upload') setUploadOpen(true);
  }, [searchParams]);

  const remove = async (attachmentId: string) => {
    const [, requestError] = await apiClient.backend.attachment.deleteById(attachmentId as never);
    if (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('attachment.error.delete'));
      return;
    }
    await load(false);
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('attachment.receipts')}
        title={t('attachment.title')}
        description={t('attachment.description')}
        action={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={17} /> {t('attachment.uploadFiles')}
          </Button>
        }
      />
      <section className="attachment-toolbar">
        <div>
          <strong>{t('attachment.fileCount', {count: total})}</strong>
          <span>{t('attachment.newestFirst')}</span>
        </div>
        <BadgeInfo />
      </section>
      {status === 'loading' && items.length === 0 ? (
        <SkeletonRows count={8} />
      ) : status === 'error' ? (
        <StatePanel state="error" description={error ?? undefined} onRetry={() => void load(false)} />
      ) : items.length === 0 ? (
        <StatePanel state="empty" title={t('attachment.none')} description={t('attachment.noneDescription')} />
      ) : (
        <>
          <section className="attachment-grid" aria-label={t('attachment.gallery')}>
            {items.map(item => (
              <article key={item.id} className="attachment-card">
                <button
                  className="attachment-preview"
                  onClick={() => setPreview(item)}
                  aria-label={t('attachment.preview', {name: item.fileName})}
                >
                  <Image src={item.signedUrl} alt="" fill sizes="(max-width: 700px) 50vw, 260px" unoptimized />
                  <span>
                    <Eye size={17} /> {t('attachment.previewAction')}
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
                    <a
                      href={item.signedUrl}
                      download={item.fileName}
                      aria-label={t('attachment.download', {name: item.fileName})}
                    >
                      <Download size={16} />
                    </a>
                    <ConfirmDialog
                      trigger={
                        <button aria-label={t('attachment.delete', {name: item.fileName})}>
                          <Trash2 size={16} />
                        </button>
                      }
                      title={t('attachment.deleteTitle', {name: item.fileName})}
                      description={t('attachment.deleteDescription')}
                      confirmLabel={t('attachment.deleteFile')}
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
                {status === 'loading' ? t('common.loading') : t('common.loadMore')}
              </Button>
              <span>{t('attachment.ofCount', {count: items.length, total})}</span>
            </div>
          )}
        </>
      )}
      <DialogShell
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title={t('attachment.uploadTitle')}
        description={t('attachment.constraints')}
      >
        <div className="entity-form">
          <SelectField
            label={t('transaction.singular')}
            value={transactionId}
            onChange={event => setTransactionId(event.target.value)}
            required
          >
            <option value="">{t('attachment.chooseTransaction')}</option>
            {data.transactions.map(item => (
              <option key={item.id} value={item.id}>
                {item.receiver} · {formatDate(item.processedAt)}
              </option>
            ))}
          </SelectField>
          {transactionId ? (
            <TransactionAttachments transactionId={transactionId} onChanged={() => void load(false)} />
          ) : (
            <StatePanel
              state="empty"
              title={t('attachment.chooseTransactionTitle')}
              description={t('attachment.chooseTransactionDescription')}
            />
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              {t('attachment.done')}
            </Button>
          </div>
        </div>
      </DialogShell>
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
    </div>
  );
}

function BadgeInfo() {
  const {t} = useI18n();
  return <span className="privacy-badge">{t('attachment.privacy')}</span>;
}
