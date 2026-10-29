import {Grid, Skeleton} from '@mui/material';
import {getTranslations} from 'next-intl/server';
import React from 'react';
import {apiClient} from '@/apiClient';
import {ErrorAlert} from '@/components/ErrorAlert';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {headers} from '@/lib/headers';
import {AllAttachmentsClient} from './AllAttachmentsClient';

const attachmentSkeletonKeys = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6'];

export default async function AttachmentsPage() {
  const t = await getTranslations('PageTitles');
  const [result, error] = await apiClient.backend.transaction.getAllTransactionAttachments(
    {from: 0, to: 20},
    {headers: await headers()},
  );

  const attachments = [...(result?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ContentGrid title={t('attachments')} description={t('attachmentsDescription')}>
      <Grid size={{xs: 12}}>
        {error ? <ErrorAlert error={error} /> : null}
        <React.Suspense
          fallback={
            <Grid container spacing={2}>
              {attachmentSkeletonKeys.map(key => (
                <Grid key={key} size={{xs: 12, sm: 6, md: 4}}>
                  <Skeleton variant="rectangular" height={200} sx={{borderRadius: 1}} />
                </Grid>
              ))}
            </Grid>
          }
        >
          {!error && (
            <AllAttachmentsClient
              initialAttachments={attachments}
              initialTotalCount={result?.totalCount ?? attachments.length}
            />
          )}
        </React.Suspense>
      </Grid>
    </ContentGrid>
  );
}
