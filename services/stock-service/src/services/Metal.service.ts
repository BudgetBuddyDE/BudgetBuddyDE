export const MetalOptions: Record<string, {name: string; unit: 'troy_oz' | 'oz'}> = {
  XPT: {name: 'Platinum', unit: 'troy_oz'},
  XAU: {name: 'Gold', unit: 'troy_oz'},
  XAG: {name: 'Silver', unit: 'troy_oz'},
  // "XPD": {name: "Palladium", unit: "troy_oz"},
};

export type TMetalQuote =
  | {
      success: true;
      base: typeof MetalOptions;
      timestamp: number;
      rates: {EUR: number; USD: number};
    }
  | {
      success: false;
      error: {
        statusCode: number;
        message: string;
      };
    };

/**
 * Service class for interacting with metal-related functionality.
 */
export class MetalService {
  private static host = 'https://api.metalpriceapi.com/v1';
  private static apiKey = process.env.METAL_API_KEY!;

  /**
   * Checks if a given metal code is valid.
   * @param code - The metal code to validate.
   * @returns True if the code is valid, false otherwise.
   */
  public static isValidMetalCode(code: string) {
    return code in MetalOptions;
  }

  /**
   * Retrieves the price of a specific metal.
   * @param metal - The metal code to get the price for.
   * @returns The metal quote containing the price in EUR and USD.
   * @throws Error if the metal code is invalid or if an error occurs during the API request.
   */
  public static async getPrice(metal: keyof typeof MetalOptions) {
    if (!this.isValidMetalCode(metal)) {
      throw new Error('Invalid metal code');
    }

    try {
      const query = new URLSearchParams();
      query.set('api_key', this.apiKey);
      query.set('base', metal);
      query.set('currencies', 'EUR,USD');
      const response = await fetch(`${this.host}/latest?${query.toString()}`);
      const data = (await response.json()) as TMetalQuote;
      if (!data.success) {
        throw new Error(data.error.message);
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Retrieves the options for metals.
   * @returns An array of objects containing the code, name, and unit of each metal option.
   */
  public static getOptions(): {code: string; name: string; unit: string}[] {
    return Object.entries(MetalOptions).map(([code, {name, unit}]) => ({code, name, unit: this.getUnitLabel(unit)}));
  }

  /**
   * Returns the label for the given unit.
   * @param unit - The unit to get the label for.
   * @returns The label for the unit.
   */
  public static getUnitLabel(unit: string) {
    return unit === 'troy_oz' ? 'Troy Ounce' : 'Ounce';
  }

  /**
   * Returns the metal with its corresponding quote.
   * @param metal - The metal code.
   * @param quote - The metal quote containing the price in EUR and USD.
   * @returns An object containing the metal code, name, and quote.
   */
  public static getMetalWithQuote(metal: keyof typeof MetalOptions, quote: {EUR: number; USD: number}) {
    return {
      code: metal,
      name: MetalOptions[metal].name,
      quote,
    };
  }
}
