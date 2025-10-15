import { type SuccessMetalQuoteResponse } from "../lib/MetalPriceAPI";
import { Cache } from "./Cache";
import { endOfDay, differenceInSeconds } from "date-fns";

export class MetalCache extends Cache {
  constructor() {
    super("metal");
  }

  /**
   * Determines the time-to-live (TTL) for metal cache entries.
   * The TTL is calculated as the number of seconds remaining until midnight.
   * @returns The TTL in seconds.
   */
  private determineTTL() {
    const now = new Date();
    const endOfToday = endOfDay(now);
    return differenceInSeconds(endOfToday, now);
  }

  public async set(
    symbol: string,
    quote: SuccessMetalQuoteResponse<string>["rates"],
  ) {
    return this.setValue(symbol, JSON.stringify(quote), {
      ttl: this.determineTTL(),
    });
  }

  public async get(
    symbol: string,
  ): Promise<SuccessMetalQuoteResponse<string>["rates"] | null> {
    const result = await this.getValue(symbol);
    return result
      ? (JSON.parse(result) as SuccessMetalQuoteResponse<string>["rates"])
      : null;
  }
}
