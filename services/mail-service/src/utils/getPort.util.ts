import {type TConfig} from '../config';
import {isRunningInProduction} from './isRunningInProduction.util';

/** Returns the port to listen on. */
export function getPort(): TConfig['port'] {
  return process.env.PORT != undefined ? Number(process.env.PORT) : isRunningInProduction() ? 18080 : 18070;
}
