import {sanitizeSpan} from '@budgetbuddyde/core/telemetry/sanitizeSpan';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {FetchInstrumentation} from '@opentelemetry/instrumentation-fetch';
import {resourceFromAttributes} from '@opentelemetry/resources';
import type {SpanExporter} from '@opentelemetry/sdk-trace';
import {BatchSpanProcessor, WebTracerProvider} from '@opentelemetry/sdk-trace-web';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {name} from '../package.json';
import {webappConfig} from './config';
import {createBackendTraceUrlPattern} from './tracePropagation';

const endpoint = process.env.NEXT_PUBLIC_OTEL_ENDPOINT?.trim().replace(/\/+$/, '');
const exporter = endpoint ? new OTLPTraceExporter({url: `${endpoint}/v1/traces`}) : undefined;
const safeExporter: SpanExporter | undefined = exporter && {
  export: (spans, callback) => exporter.export(spans.map(sanitizeSpan), callback),
  shutdown: () => exporter.shutdown(),
  forceFlush: () => exporter.forceFlush(),
};
const provider = new WebTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: `${name}-browser`,
  }),
  spanProcessors: safeExporter ? [new BatchSpanProcessor(safeExporter)] : [],
});
provider.register();

registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [createBackendTraceUrlPattern(webappConfig.backendServiceHost)],
    }),
  ],
});
