export class Formatter {
  static currency(value: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
    }).format(value);
    // return new Intl.NumberFormat('en-US', {
    //   style: 'currency',
    //   currency: 'USD',
    // }).format(value);
  }
}
