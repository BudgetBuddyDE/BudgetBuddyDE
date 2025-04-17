import { createLogger, transports } from 'winston';
import LokiTransport from 'winston-loki';

const LOKI_URL = process.env.LOKI_URL || 'http://loki:3100';


const options = {
  transports: [
    new LokiTransport({ 
      host: LOKI_URL, 
      labels: { app: 'example-api' } 
    }),
    new transports.Console()
  ],
}

export const logger = createLogger(options);