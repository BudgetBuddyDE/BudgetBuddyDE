import {differenceInSeconds, endOfDay} from 'date-fns';

import {MetalOptions, MetalService} from '../Metal.service';
import {Cache} from './Cache.service';

export class MetalCache {
  // private logger = logger.child({service: 'metal-cache'});
  private cache = new Cache('metal');

  /**
   * Determines the time-to-live (TTL) for metal cache entries.
   * The TTL is calculated as the number of seconds remaining until midnight.
   * @returns The TTL in seconds.
   */
  public determineTtlForMetal() {
    const now = new Date();
    const endOfToday = endOfDay(now);
    return differenceInSeconds(endOfToday, now);
  }

  public getMetalKey(metal: keyof typeof MetalOptions) {
    if (!MetalService.isValidMetalCode(metal)) {
      throw new Error('Invalid metal code');
    }
    return metal;
  }

  async set(metal: keyof typeof MetalOptions, quote: {EUR: number; USD: number}) {
    return this.cache.set(this.getMetalKey(metal), JSON.stringify(quote), {EX: this.determineTtlForMetal()});
  }

  async get(metal: keyof typeof MetalOptions) {
    const result = await this.cache.get(this.getMetalKey(metal));
    return result ? (JSON.parse(result) as {EUR: number; USD: number; XAUEUR: number; XAUUSD: number}) : null;
  }
}
