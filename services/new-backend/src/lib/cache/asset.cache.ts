import type {ParqetSchemas} from '@budgetbuddyde/types';
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
}
