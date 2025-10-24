export class PercentageFormatter {
  static format(value: number): string {
    return `${value.toFixed(2)} %`;
  }
}
