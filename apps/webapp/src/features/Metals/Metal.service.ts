import {type TApiResponse, type TServiceResponse} from '@budgetbuddyde/types';
import {z} from 'zod';

import {preparePockebaseRequestOptions} from '@/utils';
import {isRunningInProdEnv} from '@/utils';

export const ZMetalOption = z.object({
  code: z.string().length(3),
  name: z.string(),
  unit: z.enum(['Troy Ounce', 'Ounce']),
});
export type TMetalOption = z.infer<typeof ZMetalOption>;

export const ZMetalQuote = z.object({
  code: z.string().length(3),
  name: z.string(),
  quote: z.object({
    EUR: z.number(),
    USD: z.number(),
  }),
});
export type TMetalQuote = z.infer<typeof ZMetalQuote>;

export class MetalService {
  private static host = isRunningInProdEnv() ? (process.env.STOCK_SERVICE_HOST as string) : '/stock_service';

  /**
   * Retrieves metal quotes from the server.
   * @returns A promise that resolves to a tuple containing the parsed metal quotes data and any error that occurred during the request.
   */
  static async getQuotes(): Promise<TServiceResponse<TMetalQuote[]>> {
    try {
      const response = await fetch(`${this.host}/v1/metal/quotes`, {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TMetalQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZMetalQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves the quote for a specific metal.
   *
   * @param metal - The metal for which to retrieve the quote.
   * @returns A promise that resolves to a tuple containing the parsed metal quote and any potential error.
   */
  static async getQuote(metal: string): Promise<TServiceResponse<TMetalQuote>> {
    try {
      const response = await fetch(`${this.host}/v1/metal/quote/${metal}`, {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TMetalQuote>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = ZMetalQuote.safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves the metal options from the server.
   * @returns A promise that resolves to a tuple containing the metal options and any potential error.
   */
  static async getOptions(): Promise<TServiceResponse<TMetalOption[]>> {
    try {
      const response = await fetch(`${this.host}/v1/metal/options`, {
        ...preparePockebaseRequestOptions(),
      });
      const json = (await response.json()) as TApiResponse<TMetalOption[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZMetalOption).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}
