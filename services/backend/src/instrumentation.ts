import 'dotenv/config';
import {name} from '../package.json';
import {setupLogs} from './telemetry';
import {setupTracing} from './tracer';

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim()) {
  const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
  setupTracing(service);
  setupLogs(service);
}
