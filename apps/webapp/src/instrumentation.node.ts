import {getLogLevel} from '@budgetbuddyde/logger';
import {initializeLogging, shutdownLogging} from '@budgetbuddyde/logger/node';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {name} from '../package.json';
import {webappConfig} from './config';
const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
initializeLogging({context: {service}, level: webappConfig.log.level ?? getLogLevel(process.env.LOG_LEVEL)});
const sdk = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()
  ? new NodeSDK({
      resource: resourceFromAttributes({[ATTR_SERVICE_NAME]: service}),
      traceExporter: new OTLPTraceExporter(),
      metricReaders: [],
    })
  : undefined;
sdk?.start();

let shuttingDown: Promise<void> | undefined;
export function shutdownTelemetry(): Promise<void> {
  if (!shuttingDown) {
    shuttingDown = Promise.race([
      Promise.allSettled([sdk?.shutdown(), shutdownLogging()]).then(() => undefined),
      new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 5000);
        timer.unref();
      }),
    ]);
  }
  return shuttingDown;
}

// The application owns process lifecycle hooks and coordinates both providers here.
process.once('SIGTERM', () => void shutdownTelemetry());
process.once('SIGINT', () => void shutdownTelemetry());
process.once('beforeExit', () => void shutdownTelemetry());
