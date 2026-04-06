import {Grid} from '@mui/material';
import {AttachmentTable} from '@/components/Attachment/AttachmentTable';
import {ContentGrid} from '@/components/Layout/ContentGrid';

export default function AttachmentsPage() {
  return (
    <ContentGrid title="Attachments">
      <Grid size="grow">
        <AttachmentTable />
      </Grid>
    </ContentGrid>
  );
}
