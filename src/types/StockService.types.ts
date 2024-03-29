import {z} from 'zod';
import {ZCurrency, ZDate} from '@budgetbuddyde/types';

export const ZAssetQuote = z.object({
  currency: ZCurrency,
  exchange: z.string(),
  date: ZDate,
  datetime: ZDate,
  price: z.number(),
  isin: z.string(),
  cachedAt: ZDate,
});
export type TAssetQuote = z.infer<typeof ZAssetQuote>;

type TStockAssetType = 'security' | 'Security' | 'crypto' | 'Crypto';

type TStockAssetId<T extends 'Security' | 'Crypto'> = {
  identifier: string;
  assetType: T;
};

export type TAssetSearchEntity = {
  name: string;
  score: number;
} & (
  | {
      assetType: 'security';
      assetId: TStockAssetId<'Security'>;
      asset: {
        _id: TStockAssetId<'Security'>;
        assetType: 'Security';
        logo: string;
        name: string;
        security: {
          website?: string;
          type: 'Aktie' | 'EFT' | string;
          wkn: string;
          isin: string;
          etfDomicile?: string;
          etfCompany?: string;
        };
        popularityScore?: number;
        score: number;
      };
      security: {
        wkn: string;
        isin: string;
        name: string;
        type: 'Aktie' | 'EFT' | string;
        logo: string;
        website?: string;
      };
    }
  | {
      assetType: 'crypto';
      assetId: TStockAssetId<'Crypto'>;
      asset: {
        _id: TStockAssetId<'Crypto'>;
        assetType: 'Crypto';
        logo: string;
        name: string;
        crypto: {website: string; symbol: string};
        popularityScore: number;
        score: number;
      };
      crypto: {
        symbol: string;
        name: string;
        logo: string;
        website: string;
      };
    }
);

export type TAssetWithQuote = {
  asset: {
    _id: TStockAssetId<'Security'>;
    assetType: TStockAssetType;
    logo: string;
    name: string;
    security: {
      website: string;
      type: string;
      wkn: string;
      isin: string;
      etfDomicile?: string;
      etfCompany?: string;
    };
  };
  quote: TAssetQuote;
};
