import {LinkRounded} from '@mui/icons-material';
import {Grid, IconButton, ImageList, ImageListItem, ImageListItemBar, ListSubheader} from '@mui/material';
import NextLink from 'next/link';
import {apiClient} from '@/apiClient';
import {ErrorAlert} from '@/components/ErrorAlert';
import {Image} from '@/components/Image';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {headers} from '@/lib/headers';
import {Formatter} from '@/utils/Formatter';

export default async function AttachmentsPage() {
  const [attachments, error] = await apiClient.backend.attachment.getTransactionAttachments(
    {
      ttl: 60 * 60, // 1 hour
    },
    {
      headers: await headers(),
    },
  );

  return (
    <ContentGrid title="Attachments">
      {error !== null && (
        <Grid size={{xs: 12, md: 12}}>
          <ErrorAlert error={error} />
        </Grid>
      )}

      <Grid size={{xs: 12, md: 12}}>
        <ImageList cols={4}>
          <ImageListItem key="Subheader" cols={5}>
            <ListSubheader component="div">December</ListSubheader>
          </ImageListItem>
          {attachments?.map(item => (
            <ImageListItem key={item.id}>
              <Image srcSet={item.url} src={item.url} alt={item.fileName} sx={{width: '100%'}} loading="lazy" />
              <ImageListItemBar
                sx={{borderRadius: '8px'}}
                title={item.fileName}
                subtitle={`Uploaded on ${Formatter.date.format(item.createdAt)}`}
                // contentEditable
                actionIcon={
                  <IconButton LinkComponent={NextLink} href={item.url} target="_blank">
                    <LinkRounded />
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Grid>
    </ContentGrid>
  );
}
