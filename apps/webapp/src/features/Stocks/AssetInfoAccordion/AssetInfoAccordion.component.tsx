import {type TAssetDetails} from '@budgetbuddyde/types';
import React from 'react';

import {AssetBreakdownAccordion} from './AssetBreakdownAccordion';
import {AssetDescriptionAccordion} from './AssetDescriptionAccordion';
import {AssetRatingsAccordion} from './AssetRatingsAccordion';
import {AssetSymbolAccordion} from './AssetSymbolAccordion';
import {EtfAssetBreakdownAccordion} from './EtfAssetBreakdownAccordion';

export type TAssetRatingsAccordionProps = {
  details: TAssetDetails;
};

export const AssetInfoAccordion: React.FC<TAssetRatingsAccordionProps> = ({details}) => {
  return (
    <React.Fragment>
      <AssetDescriptionAccordion description={details.details.securityDetails?.description} />
      <AssetSymbolAccordion symbols={details.asset.security.symbols} />
      <AssetBreakdownAccordion details={details} />
      {details.asset.security.type === 'ETF' && details.details.etfBreakdown && (
        <EtfAssetBreakdownAccordion etfBreakdown={details.details.etfBreakdown} />
      )}
      <AssetRatingsAccordion ratings={details.details.scorings} />
    </React.Fragment>
  );
};
