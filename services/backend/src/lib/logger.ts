import {createLogger} from '@budgetbuddyde/logger';
import {createConsoleSink, formatConsoleEvent} from '@budgetbuddyde/logger/console';
import {config} from '../config';
import {otelLogSink} from '../telemetry';

export const logger = createLogger({
  context: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  threshold: config.log?.level ?? 'info',
  sinks: [createConsoleSink({formatter: formatConsoleEvent}), otelLogSink],
});
