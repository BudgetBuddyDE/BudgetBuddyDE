import {type TAssetDetails} from '@budgetbuddyde/types';
import React from 'react';

import {AssetBreakdownAccordion} from './AssetBreakdownAccordion';
import {AssetDescriptionAccordion} from './AssetDescriptionAccordion';
import {AssetRatingsAccordion} from './AssetRatingsAccordion';
import {AssetSymbolAccordion} from './AssetSymbolAccordion';

export type TAssetRatingsAccordionProps = {
  details: TAssetDetails;
};

export const AssetInfoAccordion: React.FC<TAssetRatingsAccordionProps> = ({details}) => {
  return (
    <React.Fragment>
      <AssetDescriptionAccordion description={details.details.securityDetails?.description} />
      <AssetSymbolAccordion symbols={details.asset.security.symbols} />
      <AssetBreakdownAccordion details={details} />
      <AssetRatingsAccordion ratings={details.details.scorings} />
    </React.Fragment>
  );
};
