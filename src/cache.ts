import {differenceInSeconds, endOfDay} from 'date-fns';
import {logger} from './core';
import {MetalOptions, MetalService} from './services/Metal.service';
import {redisClient} from './redis';

export class Cache {
  private static logger = logger.child({service: 'redis-cache'});

  /**
   * Determines the time-to-live (TTL) for metal cache entries.
   * The TTL is calculated as the number of seconds remaining until midnight.
   * @returns The TTL in seconds.
   */
  public static determineTtlForMetal() {
    const now = new Date();
    const endOfToday = endOfDay(now);
    return differenceInSeconds(endOfToday, now);
  }

  public static getMetalKey(metal: keyof typeof MetalOptions) {
    if (!MetalService.isValidMetalCode(metal)) {
      throw new Error('Invalid metal code');
    }

    return `metal:${metal}`;
  }

  public static async setMetalPrice(metal: keyof typeof MetalOptions, quote: {EUR: number; USD: number}) {
    const result = await redisClient.set(this.getMetalKey(metal), JSON.stringify(quote), {
      EX: this.determineTtlForMetal(),
    });

    this.logger.info(`Set metal price for ${metal}`, {metal, quote});

    return result;
  }

  public static async getMetalPrice(metal: keyof typeof MetalOptions): Promise<{EUR: number; USD: number} | null> {
    const result = await redisClient.get(this.getMetalKey(metal));
    if (!result) {
      this.logger.debug(`No cached metal price found for ${metal}`, {metal});
      return null;
    }

    this.logger.info(`Retrieved metal price for ${metal}`, {metal, quote: JSON.parse(result)});

    return JSON.parse(result);
  }
}
