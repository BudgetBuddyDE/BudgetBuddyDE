import {createLogger, type Logger} from '../src/logger';
import {createConsoleSink} from '../src/console';

function reportStartup(logger: Logger): void {
  logger.info('Application started');
}

const logger = createLogger({
  sinks: [createConsoleSink()],
  context: {service: 'injection-example', version: '1.0.0'},
  threshold: 'debug',
});

reportStartup(logger);
logger.debug('This is a debug message');
logger.error('This is an error message with meta', {errorCode: 123, detail: 'Something went wrong'});
