import {CurrencyFormatter} from './CurrencyFormatter';
import {DateFormatter} from './DateFormatter';
import {DurationFormatter} from './DurationFormatter';
import {PercentageFormatter} from './PercentageFormatte';

// biome-ignore lint/complexity/noStaticOnlyClass: It is a utility class
export class Formatter {
  static date = DateFormatter;
  static duration = DurationFormatter;
  static currency = CurrencyFormatter;
  static percentage = PercentageFormatter;
}
