import {getLogLevel} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, type Runtime} from '@budgetbuddyde/utils';
import 'dotenv/config';
import {name, version} from '../package.json';

const BACKEND_URL = (process.env.BUDGETBUDDY_BACKEND_URL || 'http://localhost:9000').replace(/\/+$/, '');
const TRUST_PROXY_HOPS = Math.max(0, Number.parseInt(process.env.TRUST_PROXY_HOPS || '0', 10) || 0);

export type Config = {
  service: typeof name;
  version: typeof version;
  port: ReturnType<typeof getPort>;
  trustProxyHops: number;
  runtime: Runtime;
  backendUrl: string;
  logLevel: string;
};

export const config: Config = {
  service: name,
  version: version,
  port: getPort(3070),
  trustProxyHops: TRUST_PROXY_HOPS,
  runtime: getCurrentRuntime(),
  backendUrl: BACKEND_URL,
  logLevel: getLogLevel(process.env.LOG_LEVEL),
};
