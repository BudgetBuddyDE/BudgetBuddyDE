import type {AssetIdentifier, AssetType, ParqetSchemas} from '@budgetbuddyde/types';
import type {z} from 'zod';
import {Cache} from './cache';

export class AssetCache extends Cache {
  private readonly cacheKeys = {
    sectors: 'asset_sectors',
    regions: 'asset_regions',
    industries: 'asset_industries',
  };
  private readonly countriesCacheKey = 'asset_countries';
  private readonly sectorTtlHours = 1;
  private readonly relatedAssetsTtlHours = 0.5;
  private readonly assetSearchTtlHours = 0.5;

  constructor() {
    super('asset');
  }

  public async setMapping(
    type: keyof typeof this.cacheKeys,
    values:
      | z.infer<typeof ParqetSchemas.Sector>[]
      | z.infer<typeof ParqetSchemas.Region>[]
      | z.infer<typeof ParqetSchemas.Industry>[],
  ) {
    return this.setValue(this.cacheKeys[type], JSON.stringify(values), {
      ttl: this.sectorTtlHours * 60 * 60,
    });
  }

  public async getMapping(
    type: keyof typeof this.cacheKeys,
  ): Promise<
    | z.infer<typeof ParqetSchemas.Sector>[]
    | z.infer<typeof ParqetSchemas.Region>[]
    | z.infer<typeof ParqetSchemas.Industry>[]
    | null
  > {
    const result = await this.getValue(this.cacheKeys[type]);
    return result
      ? (JSON.parse(result) as
          | z.infer<typeof ParqetSchemas.Sector>[]
          | z.infer<typeof ParqetSchemas.Region>[]
          | z.infer<typeof ParqetSchemas.Industry>[])
      : null;
  }

  public async setCountries(countries: z.infer<typeof ParqetSchemas.Country>[]) {
    return this.setValue(this.countriesCacheKey, JSON.stringify(countries), {
      ttl: this.sectorTtlHours * 60 * 60,
    });
  }

  public async getCountries(): Promise<z.infer<typeof ParqetSchemas.Country>[] | null> {
    const result = await this.getValue(this.countriesCacheKey);
    return result ? (JSON.parse(result) as z.infer<typeof ParqetSchemas.Country>[]) : null;
  }

  public resolveEntityMapping(entity: string): keyof typeof this.cacheKeys {
    switch (entity) {
      case 'AssetService.SecuritySector':
        return 'sectors';
      case 'AssetService.SecurityRegion':
        return 'regions';
      case 'AssetService.SecurityIndustry':
        return 'industries';
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private buildRelatedAssetsCacheKey(identifier: z.infer<typeof AssetIdentifier>, limit: number): string {
    return `related_assets_${identifier}_${limit}`;
  }

  public async setRelatedAssets(
    identifier: z.infer<typeof AssetIdentifier>,
    limit: number,
    relatedAssets: z.infer<typeof ParqetSchemas.RelatedAsset>[],
  ) {
    return this.setValue(this.buildRelatedAssetsCacheKey(identifier, limit), JSON.stringify(relatedAssets), {
      ttl: this.relatedAssetsTtlHours * 60 * 60,
    });
  }

  public async getRelatedAssets(
    identifier: z.infer<typeof AssetIdentifier>,
    limit: number,
  ): Promise<z.infer<typeof ParqetSchemas.RelatedAsset>[] | null> {
    const result = await this.getValue(this.buildRelatedAssetsCacheKey(identifier, limit));
    return result ? (JSON.parse(result) as z.infer<typeof ParqetSchemas.RelatedAsset>[]) : null;
  }

  private buildAssetSearchCacheKey(searchTerm: string): string {
    return `asset_search_${searchTerm.replaceAll(' ', '_').toLowerCase()}`;
  }

  public async cacheAssetSearchResults(
    query: string,
    results: {
      identifier: z.infer<typeof AssetIdentifier>;
      name: string;
      assetType: z.infer<typeof AssetType>;
      logoUrl: string | null;
    }[],
  ) {
    return this.setValue(this.buildAssetSearchCacheKey(query), JSON.stringify(results), {
      ttl: this.assetSearchTtlHours * 60 * 60,
    });
  }

  public async getCachedAssetSearchResults(
    query: string,
  ): Promise<Parameters<typeof this.cacheAssetSearchResults>[1] | null> {
    const result = await this.getValue(this.buildAssetSearchCacheKey(query));
    return result ? (JSON.parse(result) as Parameters<typeof this.cacheAssetSearchResults>[1]) : null;
  }
}
