import {getLogLevel} from '@budgetbuddyde/logger';
import {initializeLogging} from '@budgetbuddyde/logger/node';
import {name} from '../package.json';
import {config} from './config';
import {parseEnvironment} from './env';
import {shutdownTelemetry} from './telemetry';

const env = parseEnvironment(process.env);
const service = env.OTEL_SERVICE_NAME || name;
initializeLogging({context: {service}, level: config.log?.level ?? getLogLevel(env.LOG_LEVEL)});
process.once('beforeExit', () => void shutdownTelemetry());
