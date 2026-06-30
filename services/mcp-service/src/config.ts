import {getLogLevel} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, type Runtime} from '@budgetbuddyde/utils';
import 'dotenv/config';
import {name, version} from '../package.json';

export type Config = {
  service: typeof name;
  version: typeof version;
  port: ReturnType<typeof getPort>;
  runtime: Runtime;
  backendUrl: string;
  backendApiKey: string;
  mcpApiKey: string | null;
  logLevel: string;
};

export const config: Config = {
  service: name,
  version: version,
  port: getPort(7000),
  runtime: getCurrentRuntime(),
  backendUrl: process.env.BUDGETBUDDY_BACKEND_URL || 'http://localhost:9000',
  backendApiKey: process.env.BUDGETBUDDY_API_KEY || '',
  mcpApiKey: process.env.MCP_API_KEY?.trim() || null,
  logLevel: getLogLevel(process.env.LOG_LEVEL),
};
