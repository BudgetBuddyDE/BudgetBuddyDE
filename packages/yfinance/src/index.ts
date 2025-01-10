import { Analysis } from './core/Analysis';
import { createLogger } from './utils/logger';

export const logger = createLogger({ level: 'debug' });

logger.info('Hola mundo');

const analysis = new Analysis('MAIN');
(async () => {
  await analysis._fetch(['earningDates']);
})();
