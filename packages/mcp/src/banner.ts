import {textSync} from 'figlet';
import {cyan} from 'kleur/colors';
import {ApplicationConfig} from './appConfig';
export function printBanner(): void {
  const banner = textSync(ApplicationConfig.servicename, {font: 'ANSI Shadow', horizontalLayout: 'default'});
  process.stdout.write(`${cyan(banner)}\n\n`);
}
