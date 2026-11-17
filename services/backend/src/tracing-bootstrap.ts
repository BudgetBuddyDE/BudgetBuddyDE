import {name} from '../package.json';
import {parseEnvironment} from './env';
import {setupTracing} from './tracer';

const env = parseEnvironment(process.env);
const service = env.OTEL_SERVICE_NAME || name;
if (env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const protocol = env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL || env.OTEL_EXPORTER_OTLP_PROTOCOL;
  if (protocol && protocol !== 'http/protobuf') {
    console.warn('OTLP trace export supports only http/protobuf; trace export is disabled.');
  } else {
    setupTracing(service);
  }
}
