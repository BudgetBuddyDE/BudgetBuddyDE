import {name} from '../package.json';
import {setupTracing} from './tracer';

const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
if (process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() || process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) {
  const protocol =
    process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
  if (protocol && protocol !== 'http/protobuf') {
    console.warn('OTLP trace export supports only http/protobuf; trace export is disabled.');
  } else {
    setupTracing(service);
  }
}
