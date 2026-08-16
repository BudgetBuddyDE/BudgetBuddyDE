import {textSync} from 'figlet';
import {cyan} from 'kleur/colors';
import {name} from '../package.json';

export function printBanner(): void {
  const banner = textSync(name, {font: 'ANSI Shadow', horizontalLayout: 'default'});
  process.stdout.write(`${cyan(banner)}\n\n`);
}
