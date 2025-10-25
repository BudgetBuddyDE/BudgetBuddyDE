import {createLogger, LogLevel} from '../src/logger';
import {ConsoleTransport} from '../src/transport';

const logger = createLogger({
  label: 'MyApp',
  level: LogLevel.DEBUG,
  defaultMeta: {
    service: 'MyApp',
    version: '1.0.0',
    environment: 'production',
  },
  transports: [
    new ConsoleTransport({}),
    new ConsoleTransport({label: 'Disabled', enabled: false}),
    new ConsoleTransport({label: 'Demo', level: LogLevel.ERROR}),
  ],
});

logger.debug("This is a debug message that won't be shown by default");
logger.info('This is an info message');
logger.error('This is an error message with meta', {errorCode: 123, detail: 'Something went wrong'});
