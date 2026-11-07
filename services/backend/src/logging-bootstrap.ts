import {getLogLevel} from '@budgetbuddyde/logger';
import {initializeLogging} from '@budgetbuddyde/logger/node';
import {name} from '../package.json';
import {config} from './config';
import {shutdownTelemetry} from './telemetry';

const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
initializeLogging({context: {service}, level: config.log?.level ?? getLogLevel(process.env.LOG_LEVEL)});
process.once('beforeExit', () => void shutdownTelemetry());
