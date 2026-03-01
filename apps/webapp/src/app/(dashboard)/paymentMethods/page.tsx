import {Grid} from '@mui/material';
import {parseKeywordFilterFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';
import {PaymentMethodTable} from '@/components/PaymentMethod/PaymentMethodTable';

export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const {keyword} = parseKeywordFilterFromParams(params);

  return (
    <ContentGrid title="Payment Methods">
      <Grid size={{xs: 12, md: 12}}>
        <PaymentMethodTable initialKeyword={keyword ?? undefined} />
      </Grid>
    </ContentGrid>
  );
}
