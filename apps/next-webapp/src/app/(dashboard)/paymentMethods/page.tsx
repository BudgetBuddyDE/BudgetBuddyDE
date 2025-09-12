import { ContentGrid } from '@/components/Layout/ContentGrid';
import { PaymentMethodTable } from '@/components/PaymentMethod/PaymentMethodTable';
import { Grid } from '@mui/material';

export default async function PaymentMethodsPage() {
  return (
    <ContentGrid title="Payment Methods">
      <Grid size={{ xs: 12, md: 9 }}>
        <PaymentMethodTable />
      </Grid>
    </ContentGrid>
  );
}
