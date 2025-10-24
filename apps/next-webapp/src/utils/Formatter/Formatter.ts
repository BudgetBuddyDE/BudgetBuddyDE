import { CurrencyFormatter } from './CurrencyFormatter';
import { DateFormatter } from './DateFormatter';
import { PercentageFormatter } from './PercentageFormatte';

export class Formatter {
  static date = DateFormatter;
  static currency = CurrencyFormatter;
  static percentage = PercentageFormatter;
}
