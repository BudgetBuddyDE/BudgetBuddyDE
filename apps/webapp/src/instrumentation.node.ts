import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-proto';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchLogRecordProcessor} from '@opentelemetry/sdk-logs';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-node';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {name} from '../package.json';
import {registerServerLogSink} from './telemetry-sink';
import {otelLogSink} from './telemetry.node';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME?.trim() || name,
  }),
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
  logRecordProcessors: [new BatchLogRecordProcessor({exporter: new OTLPLogExporter()})],
  metricReaders: [],
});
sdk.start();
registerServerLogSink(otelLogSink);
console.info('[OpenTelemetry] Server-side log and trace export is configured. Delivery has not been verified.');

let shuttingDown: Promise<void> | undefined;
export function shutdownTelemetry(): Promise<void> {
  if (!shuttingDown) {
    shuttingDown = Promise.race([
      sdk.shutdown().catch(() => undefined),
      new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 5000);
        timer.unref();
      }),
    ]);
  }
  return shuttingDown;
}

// Next.js retains ownership of signals and server shutdown; begin flushing in parallel.
process.once('SIGTERM', () => void shutdownTelemetry());
process.once('SIGINT', () => void shutdownTelemetry());
process.once('beforeExit', () => void shutdownTelemetry());
