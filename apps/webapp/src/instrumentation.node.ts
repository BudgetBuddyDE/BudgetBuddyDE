import {getLogLevel} from '@budgetbuddyde/logger';
import {initializeLogging, shutdownLogging} from '@budgetbuddyde/logger/node';
import {AsyncLocalStorageContextManager} from '@opentelemetry/context-async-hooks';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {UndiciInstrumentation} from '@opentelemetry/instrumentation-undici';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace';
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {name} from '../package.json';
import {webappConfig} from './config';
const backendOrigin = new URL(webappConfig.backendServiceHost).origin;
let provider: NodeTracerProvider | undefined;
const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
initializeLogging({context: {service}, level: webappConfig.log.level ?? getLogLevel(process.env.LOG_LEVEL)});
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) {
  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({[ATTR_SERVICE_NAME]: service}),
    spanProcessors: [new BatchSpanProcessor({exporter: new OTLPTraceExporter()})],
  });
  provider.register({contextManager: new AsyncLocalStorageContextManager().enable()});
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new UndiciInstrumentation({ignoreRequestHook: request => new URL(request.origin).origin !== backendOrigin}),
    ],
  });
}

let shuttingDown: Promise<void> | undefined;
export function shutdownTelemetry(): Promise<void> {
  if (!shuttingDown) {
    shuttingDown = Promise.race([
      Promise.allSettled([provider?.shutdown(), shutdownLogging()]).then(() => undefined),
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
