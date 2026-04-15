import {Grid, Skeleton} from '@mui/material';
import React from 'react';
import {apiClient} from '@/apiClient';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {headers} from '@/lib/headers';
import {AllAttachmentsClient} from './AllAttachmentsClient';

export default async function AttachmentsPage() {
  const [result] = await apiClient.backend.transaction.getAllTransactionAttachments(undefined, {
    headers: await headers(),
  });

  const attachments = [...(result?.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ContentGrid title="Attachments" description="All your transaction attachments in one place">
      <Grid size={{xs: 12}}>
        <React.Suspense
          fallback={
            <Grid container spacing={2}>
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Skeletons have no meaningful key
                <Grid key={i} size={{xs: 12, sm: 6, md: 4}}>
                  <Skeleton variant="rectangular" height={200} sx={{borderRadius: 1}} />
                </Grid>
              ))}
            </Grid>
          }
        >
          <AllAttachmentsClient initialAttachments={attachments} />
        </React.Suspense>
      </Grid>
    </ContentGrid>
  );
}
