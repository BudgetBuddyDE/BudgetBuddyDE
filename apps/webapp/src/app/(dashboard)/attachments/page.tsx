import {Grid} from '@mui/material';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {AllAttachments} from './AllAttachments';

export default function AttachmentsPage() {
  return (
    <ContentGrid title="Attachments" description="All your transaction attachments in one place">
      <Grid size={{xs: 12}}>
        <AllAttachments />
      </Grid>
    </ContentGrid>
  );
}
