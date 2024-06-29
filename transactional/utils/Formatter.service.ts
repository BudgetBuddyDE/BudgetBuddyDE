export class Formatter {
  static currency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
    // return new Intl.NumberFormat('en-US', {
    //   style: 'currency',
    //   currency: 'USD',
    // }).format(value);
  }
}
