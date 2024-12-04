import {
  type TApiResponse,
  type TServiceResponse,
  type TStockPositionWithQuote,
  ZStockPositionWithQuote,
} from '@budgetbuddyde/types';
import {z} from 'zod';

export const ZMetalQuote = z.object({
  code: z.string().length(3),
  name: z.string(),
  quote: z.object({
    EUR: z.number(),
    USD: z.number(),
  }),
});
export type TMetalQuote = z.infer<typeof ZMetalQuote>;

export class StockService {
  static readonly host = process.env.STOCK_SERVICE_HOST;
  static readonly BEARER_TOKEN = process.env.STOCK_SERVICE_BEARER_TOKEN;

  /**
   * Retrieves the positions of stocks with quotes.
   * @param userId The user ID to retrieve the stock positions for.
   * @returns A promise that resolves to a tuple containing the stock positions with quotes and an error, if any.
   */
  static async getPositions(userId: string): Promise<TServiceResponse<TStockPositionWithQuote[]>> {
    try {
      const response = await fetch(`${this.host}/v1/asset/position`, {
        headers: {
          Authorization: `Bearer ${this.BEARER_TOKEN}`,
          'X-User-Id': userId,
        },
      });
      const json = (await response.json()) as TApiResponse<TStockPositionWithQuote[]>;
      if (json.status != 200) return [null, new Error(json.message!)];

      const parsingResult = z.array(ZStockPositionWithQuote).safeParse(json.data);
      if (!parsingResult.success) throw parsingResult.error;
      return [parsingResult.data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }

  /**
   * Retrieves metal quotes from the server.
   * @param userId The user ID in order to pass authentication.
   * @returns A promise that resolves to a tuple containing the parsed metal quotes data and any error that occurred during the request.
   */
  static async getMetalQuotes(userId: string): Promise<TServiceResponse<TMetalQuote[]>> {
    try {
      const response = await fetch(`${this.host}/v1/metal/quotes`, {
        headers: {
          Authorization: `Bearer ${this.BEARER_TOKEN}`,
          'X-User-Id': userId,
        },
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
}
