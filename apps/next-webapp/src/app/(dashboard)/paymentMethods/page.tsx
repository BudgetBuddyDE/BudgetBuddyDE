import { ErrorAlert } from '@/components/ErrorAlert';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { PaymentMethodTable } from '@/components/PaymentMethod/PaymentMethodTable';
import { PaymentMethodService } from '@/services/PaymentMethod.service';
import { Grid } from '@mui/material';
import { headers } from 'next/headers';

export default async function PaymentMethodsPage() {
  const [paymentMethods, error] = await PaymentMethodService.getPaymentMethods(undefined, {
    headers: await headers(),
  });
  return (
    <ContentGrid title="Payment Methods" description="Manage your payment methods...">
      <Grid size={{ xs: 12, md: 8 }}>
        {error ? (
          <ErrorAlert error={error} />
        ) : (
          <PaymentMethodTable paymentMethods={paymentMethods} />
        )}
      </Grid>
    </ContentGrid>
  );
}
