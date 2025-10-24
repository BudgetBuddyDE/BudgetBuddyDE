import { headers } from 'next/headers';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { AssetService } from '@/services/Stock';
import { Grid, Typography } from '@mui/material';
import { RelatedAsset } from '@/components/Stocks/RelatedAsset';
import { ErrorAlert } from '@/components/ErrorAlert';
import { SymbolList } from '@/components/Stocks/Cards/SymbolList';
import {
  AssetMetrics,
  BreakdownPieChart,
  CompanyDetails,
  DividendInformation,
  EtfCompanyDetails,
  FinancialStatements,
  News,
  PriceTargetConsensus,
  PriceTargetConsensusProps,
  Recommendations,
  Scorings,
} from '@/components/Stocks/Cards';
import { StockPositionTable } from '@/components/Stocks/StockPositionTable';
import { EtfDetails } from '@/components/Stocks/Cards/EtfDetails';
import { AssetPriceChart } from '@/components/Stocks/AssetPriceChart';
import { Card } from '@/components/Card';
import { ReadMoreText } from '@/components/ReadMoreText';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

export default async function StockPage({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params;
  const [asset, assetErr] = await AssetService.positions.getAsset(identifier, {
    headers: await headers(),
  });
  const [relatedAssets, relatedAssetsError] = await AssetService.positions.getRelatedAssets(
    identifier,
    true,
    {
      headers: await headers(),
    }
  );

  if (!asset) {
    // FIXME: Implement 404 page
    return <h1>Asset not found</h1>;
  }
  const priceTargetConsensus = asset.analysis.priceTargetConsensus;
  const PriceTargetConsensusProps: PriceTargetConsensusProps = {
    currency: priceTargetConsensus?.currency || asset.currency || '',
    priceTargetConsensus: priceTargetConsensus
      ? {
          high: priceTargetConsensus?.high,
          consensus: priceTargetConsensus?.consensus,
          median: priceTargetConsensus?.median,
          low: priceTargetConsensus?.low,
        }
      : null,
  };
  const isCommodity = asset.assetType === 'Commodity';
  const isCrypto = asset.securityType === 'Crypto';
  const isSecurity = !isCommodity && !isCrypto;
  return (
    <ContentGrid title={asset.name} description={identifier}>
      {assetErr && (
        <Grid size={{ xs: 12 }}>
          <ErrorAlert error={assetErr} />
        </Grid>
      )}

      <Grid container size={isCrypto ? { xs: 12, lg: 12 } : { xs: 12, lg: 8.5 }}>
        <Grid size={{ xs: 12 }}>
          <AssetPriceChart
            assetName={asset.name}
            currency={asset.currency || 'EUR'}
            identifier={identifier}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <StockPositionTable
            assets={[identifier]}
            defaultValues={{
              createEntity: {
                isin: identifier,
                assetType: asset.assetType,
                name: asset.name,
                logoUrl: asset.logoUrl ?? '', // REVISIT: Assets from positions always have a logo URL
              },
            }}
          />
        </Grid>

        {isSecurity && (
          <Grid container size={{ xs: 12 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Recommendations recommendations={asset.analysis.recommendation} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <PriceTargetConsensus {...PriceTargetConsensusProps} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Scorings scorings={asset.analysis.scorings} />
            </Grid>
          </Grid>
        )}

        {isSecurity && (
          <Grid size={{ xs: 12 }}>
            <FinancialStatements
              currency={asset.currency || 'EUR'} // FIXME: currency should always be defined
              financials={asset.financials}
              historicalDividends={asset.dividends.yearlyTTM}
            />
          </Grid>
        )}

        <Grid container size={{ xs: 12 }}>
          {relatedAssetsError && (
            <Grid size={{ xs: 12 }}>
              <ErrorAlert error={relatedAssetsError} />
            </Grid>
          )}
          {(relatedAssets ?? []).map((asset) => (
            <Grid key={asset.identifier} size={{ xs: 12, md: 4 }}>
              <RelatedAsset asset={asset} />
            </Grid>
          ))}
        </Grid>

        <Grid size={{ xs: 12 }}>
          <News news={asset.news} />
        </Grid>
      </Grid>

      <Grid container size={isCrypto ? { xs: 0 } : { xs: 12, lg: 3.5 }}>
        {!isCrypto && (
          <Grid size={{ xs: 12 }}>
            {isCommodity && asset.description && (
              <Card>
                <Card.Body>
                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                  <ReadMoreText text={asset.description} />
                </Card.Body>
              </Card>
            )}

            {(asset.securityType === 'Aktie' || asset.securityType === 'Zertifikat') && (
              <CompanyDetails
                name={asset.name}
                securityType={asset.securityType}
                identifier={asset.identifier}
                wkn={asset.wkn}
                assetType={asset.assetType}
                description={asset.description}
              />
            )}

            {asset.securityType === 'ETF' && (
              <EtfCompanyDetails
                name={asset.name}
                securityType={asset.securityType}
                identifier={asset.identifier}
                wkn={asset.wkn}
                assetType={asset.assetType}
                description={asset.description}
                etfCompany={asset.etfCompany}
                etfDomicile={asset.etfDomicile}
              />
            )}
          </Grid>
        )}

        {isSecurity && (
          <Grid size={{ xs: 12 }}>
            <ErrorBoundary>
              <AssetMetrics
                beta={asset.beta}
                fiftyTwoWeekRange={asset.fiftyTwoWeekRange}
                marketCap={asset.marketCap}
                currency={asset.currency}
                dividendPerShareTTM={asset.dividendPerShareTTM}
                dividendYieldPercentageTTM={asset.dividendYieldPercentageTTM}
                payoutRatioTTM={asset.payoutRatioTTM}
                peRatioTTM={asset.peRatioTTM}
                pegRatioTTM={asset.pegRatioTTM}
                priceFairValueRatio={asset.priceFairValueRatio}
                priceSalesRatioTTM={asset.priceSalesRatioTTM}
                priceToBookRatioTTM={asset.priceToBookRatioTTM}
              />
            </ErrorBoundary>
          </Grid>
        )}

        {asset.etfDetails && (
          <Grid size={{ xs: 12 }}>
            <EtfDetails details={asset.etfDetails} />
          </Grid>
        )}

        {isSecurity && (
          <Grid size={{ xs: 12 }}>
            <DividendInformation
              KPIs={asset.dividends.KPIs}
              historical={asset.dividends.historical}
              future={asset.dividends.future}
              yearlyTTM={asset.dividends.yearlyTTM}
              payoutInterval={asset.dividends.payoutInterval}
            />
          </Grid>
        )}

        {isSecurity && (
          <Grid size={{ xs: 12 }}>
            <BreakdownPieChart
              regions={asset.regions}
              countries={asset.countries}
              sectors={asset.sectors}
              industries={asset.industries}
            />
          </Grid>
        )}

        {isSecurity && (
          <Grid size={{ xs: 12 }}>
            <SymbolList symbols={asset.symbols} />
          </Grid>
        )}
      </Grid>
    </ContentGrid>
  );
}
