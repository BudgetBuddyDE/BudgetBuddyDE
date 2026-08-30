import {createLogger} from '../src/logger';
import {createConsoleLogEventWriter} from '../src/console';

const logger = createLogger(createConsoleLogEventWriter(), {
  context: {service: 'console-example'},
  threshold: 'info',
});

logger.info('This is an info message');

logger.warn('This warns about something and will provide some metadata', {field1: 'value1', field2: 'value2'});

const childLogger = logger.child({
  module: 'child-example',
});

childLogger.info('This is an info message from the child logger', {meta: 'data'});
