import {differenceInSeconds, endOfDay} from 'date-fns';

import {logger} from '../core';
import {redisClient} from '../redis';
import {MetalOptions, MetalService} from './Metal.service';

/**
 * Represents a cache for storing metal prices.
 */
export class CacheService {
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

  /**
   * Returns the cache key for the specified metal.
   * @param metal - The metal code.
   * @returns The cache key for the specified metal.
   * @throws Error if the metal code is invalid.
   */
  public static getMetalKey(metal: keyof typeof MetalOptions) {
    if (!MetalService.isValidMetalCode(metal)) {
      throw new Error('Invalid metal code');
    }

    return `metal:${metal}`;
  }

  /**
   * Sets the metal price in the cache.
   *
   * @param metal - The type of metal.
   * @param quote - The metal price quote object containing EUR and USD values.
   * @returns A Promise that resolves to the result of setting the metal price in the cache.
   */
  public static async setMetalPrice(metal: keyof typeof MetalOptions, quote: {EUR: number; USD: number}) {
    const result = await redisClient.set(this.getMetalKey(metal), JSON.stringify(quote), {
      EX: this.determineTtlForMetal(),
    });

    this.logger.info(`Set metal price for ${metal}`, {metal, quote});

    return result;
  }

  /**
   * Retrieves the metal price from the cache.
   * @param metal - The type of metal to retrieve the price for.
   * @returns A promise that resolves to an object containing the metal price in EUR and USD, or null if the price is not found in the cache.
   */
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
