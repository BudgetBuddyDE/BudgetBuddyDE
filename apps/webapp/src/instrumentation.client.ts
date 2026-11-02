import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {FetchInstrumentation} from '@opentelemetry/instrumentation-fetch';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchSpanProcessor, WebTracerProvider} from '@opentelemetry/sdk-trace-web';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {name} from '../package.json';
import {webappConfig} from './config';
import {createBackendTraceUrlPattern} from './tracePropagation';

const provider = new WebTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: `${name}-browser`,
  }),
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({url: `${process.env.NEXT_PUBLIC_OTEL_ENDPOINT?.replace(/\/+$/, '')}/v1/traces`}),
    ),
  ],
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
