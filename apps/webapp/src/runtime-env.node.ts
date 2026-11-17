import {z} from 'zod';

const runtimeEnvSchema = z.object({
  OTEL_SERVICE_NAME: z.string().optional(),
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: z.string().optional(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z.string().optional(),
  OTEL_TRACES_EXPORTER: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

const result = runtimeEnvSchema.safeParse({
  OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL,
  OTEL_EXPORTER_OTLP_PROTOCOL: process.env.OTEL_EXPORTER_OTLP_PROTOCOL,
  OTEL_TRACES_EXPORTER: process.env.OTEL_TRACES_EXPORTER,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

if (!result.success) throw new Error('Invalid server runtime environment variables.');

export const runtimeEnv = result.data;
