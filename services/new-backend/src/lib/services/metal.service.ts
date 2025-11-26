export type SuccessMetalQuoteResponse<Base extends string> = {
  success: true;
  base: Base;
  timestamp: number;
  rates: {EUR: number; USD: number};
};
export type ErrorMetalQuoteResponse = {
  success: false;
  error: {
    statusCode: number;
    message: string;
  };
};

export type MetalQuote<Base extends string> = SuccessMetalQuoteResponse<Base> | ErrorMetalQuoteResponse;

/**
 * Service class for interacting with metal-related functionality.
 */
// biome-ignore lint/complexity/noStaticOnlyClass: This class is a simple container for static services
export class MetalPriceAPI {
  private static host = 'https://api.metalpriceapi.com/v1';
  private static apiKey = process.env.METAL_API_KEY as string;

  /**
   * Retrieves the price of a specific metal.
   * @param metal - The metal code to get the price for.
   * @returns The metal quote containing the price in EUR and USD.
   * @throws Error if the metal code is invalid or if an error occurs during the API request.
   */
  public static async getPrice(metal: string) {
    const query = new URLSearchParams();
    query.set('api_key', MetalPriceAPI.apiKey);
    query.set('base', metal);
    query.set('currencies', 'EUR,USD');
    const response = await fetch(`${MetalPriceAPI.host}/latest?${query.toString()}`);
    const data = (await response.json()) as MetalQuote<string>;
    if (!data.success) {
      throw data.error.message;
      // throw new Error(data.error.message);
    }

    return data;
  }
}
