import { z } from "zod";
import { Cache } from "./Cache";
import { Region, Sector } from "../types";

export class AssetCache extends Cache {
  private readonly cacheKeys = {
    sectors: "asset_sectors",
    regions: "asset_regions",
  };
  private readonly sectorTtlHours = 1;

  constructor() {
    super("asset");
  }

  public async setSectors(sectors: z.infer<typeof Sector>[]) {
    return this.setValue(this.cacheKeys.sectors, JSON.stringify(sectors), {
      ttl: this.sectorTtlHours * 60 * 60,
    });
  }

  public async getSectors(): Promise<z.infer<typeof Sector>[] | null> {
    const result = await this.getValue(this.cacheKeys.sectors);
    return result ? (JSON.parse(result) as z.infer<typeof Sector>[]) : null;
  }

  public async setRegions(regions: z.infer<typeof Region>[]) {
    return this.setValue(this.cacheKeys.regions, JSON.stringify(regions), {
      ttl: this.sectorTtlHours * 60 * 60,
    });
  }

  public async getRegions(): Promise<z.infer<typeof Region>[] | null> {
    const result = await this.getValue(this.cacheKeys.regions);
    return result ? (JSON.parse(result) as z.infer<typeof Region>[]) : null;
  }
}
