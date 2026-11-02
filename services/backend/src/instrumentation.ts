import 'dotenv/config';
import {getLogLevel} from '@budgetbuddyde/logger';
import {initializeLogging} from '@budgetbuddyde/logger/node';
import {name} from '../package.json';
import {config} from './config';
import {shutdownTelemetry} from './telemetry';
import {setupTracing} from './tracer';

const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
initializeLogging({context: {service}, level: config.log?.level ?? getLogLevel(process.env.LOG_LEVEL)});

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) {
  setupTracing(service);
}

process.once('beforeExit', () => void shutdownTelemetry());
