import { z } from "zod";
import { Cache } from "./Cache";
import { Sector } from "../types";

export class AssetCache extends Cache {
  private readonly sectorTtlHours = 1;

  constructor() {
    super("asset");
  }

  public async setSectors(sectors: z.infer<typeof Sector>[]) {
    return this.setValue("sectors", JSON.stringify(sectors), {
      ttl: this.sectorTtlHours * 60 * 60,
    });
  }

  public async getSectors(): Promise<z.infer<typeof Sector>[] | null> {
    const result = await this.getValue("sectors");
    return result ? (JSON.parse(result) as z.infer<typeof Sector>[]) : null;
  }
}
