import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";

const tempoUrl = process.env.TEMPO_URL || "http://tempo:4318";
const tempoIngestAPIUrl = `${tempoUrl}/v1/traces`;

// Configure the trace exporter
const traceExporter = new OTLPTraceExporter({
  url: tempoIngestAPIUrl
});

// Create and register the SDK
const sdk = new NodeSDK({
  resource: new Resource({
    "service.name": process.env.TEMPO_SERVICE_NAME || 'unknown',
  }),
  traceExporter: traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Initialize the SDK and register with the OpenTelemetry API
sdk.start();

// Gracefully shut down the SDK on process exit
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error) => console.log("Error terminating tracing", error))
    .finally(() => process.exit(0));
});