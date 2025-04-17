import express from 'express';
import promMiddleware from 'express-prometheus-middleware';
import { trace } from "@opentelemetry/api";

import { logger } from './logger.js';
import './tracer.js';


const app = express();
const PORT = process.env.PORT || 9091;

app.use(promMiddleware({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5],
}));

// this creates custom spans to be sent to tempo
const tracer = trace.getTracer(process.env.TEMPO_SERVICE_NAME || 'unknown')

app.get('/hello', (req, res) => {
  const span = tracer.startSpan("parse json");
  logger.info('Request to hello endpoint v2');
  const { name = 'Anon' } = req.query;
  res.json({ message: `Hello, ${name}!` });
  span.end();
});

app.listen(PORT, () => {
  console.log(`Example api is listening on http://localhost:${PORT}`);
});