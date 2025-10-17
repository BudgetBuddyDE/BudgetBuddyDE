import { headers } from 'next/headers';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { CircularProgress } from '@/components/Loading';
import { NoResults } from '@/components/NoResults';
import { AssetService } from '@/services/Stock';
import { TimelineRounded } from '@mui/icons-material';
import { Grid } from '@mui/material';
import { RelatedAsset } from '@/components/Stocks/RelatedAsset';
import { ErrorAlert } from '@/components/ErrorAlert';

export default async function StockPage({ params }: { params: Promise<{ isin: string }> }) {
  const { isin } = await params;
  const [relatedAssets, relatedAssetsError] = await AssetService.positions.getRelatedAssets(
    isin,
    true,
    {
      headers: await headers(),
    }
  );

  return (
    <ContentGrid title="COMPANY NAME" description={isin}>
      <Grid container size={{ xs: 12, lg: 9 }}>
        <CircularProgress />
        PriceChart
        <NoResults icon={<TimelineRounded />} text="No quotes found" />
      </Grid>

      <Grid container>
        {relatedAssetsError && (
          <Grid size={{ xs: 12 }}>
            <ErrorAlert error={relatedAssetsError} />
          </Grid>
        )}
        {(relatedAssets ?? []).map((asset) => (
          <Grid size={{ xs: 12, md: 4 }}>
            <RelatedAsset asset={asset} />
          </Grid>
        ))}
      </Grid>
    </ContentGrid>
  );
}
