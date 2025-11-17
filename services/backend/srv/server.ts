import 'dotenv/config';
import cds from '@sap/cds';
import cron from 'node-cron';
import { Subscriptions, Transaction, Transactions } from '#cds-models/BackendService';
import { format } from 'date-fns';

const ORIGINS = Object.fromEntries(
  (process.env.ORIGINS || 'http://localhost:3000').split(',').map((origin) => [origin, 1])
);

cds.on('bootstrap', (app) => {
  // FIXME: This is a temporary solution, consider using a more robust CORS middleware in production
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) {
      cds.log('cors').debug('No origin header present in the request');
      // REVISIT: Bad behavior? BUT it will be resolved by the next major version
      return next();
    }
    cds
      .log('cors')
      .debug(`CORS check for ${origin}. Allowed origins: ${Object.keys(ORIGINS).join(', ')}`);

    if (origin && origin in ORIGINS) {
      res
        .set('Access-Control-Allow-Origin', origin)
        .set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
        .set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        .set('Access-Control-Allow-Credentials', 'true');
      cds.log('cors').debug(`CORS preflight request from ${origin}`);

      if (req.method === 'OPTIONS') {
        return res.set('access-control-allow-methods', 'GET,HEAD,PUT,PATCH,POST,DELETE').end();
      }
      return next();
    }
  });

  const jobName = 'process-recurring-payments';
  cron.schedule(
    '30 1 * * *',
    async () => {
      try {
        cds.log(jobName).info('Starting recurring payments processing job...');
        const today = format(new Date(), 'yyyy-MM-dd');
        const records = await SELECT.from(Subscriptions)
          .columns(
            'ID',
            'owner',
            'transferAmount',
            'toCategory_ID',
            'toPaymentMethod_ID',
            'receiver',
            'information'
          )
          .where({ nextExecution: today });

        await INSERT.into(Transactions).entries(
          records.map(
            (subscription) =>
              ({
                ID: cds.utils.uuid(),
                owner: subscription.owner,
                processedAt: today,
                transferAmount: subscription.transferAmount,
                toCategory_ID: subscription.toCategory_ID,
                toPaymentMethod_ID: subscription.toPaymentMethod_ID,
                receiver: subscription.receiver,
                information: subscription.information,
                createdAt: new Date().toISOString(),
                createdBy: 'system',
                modifiedAt: new Date().toISOString(),
                modifiedBy: 'system',
              }) as Transaction
          )
        );

        cds.log(jobName).info(`Processed ${records.length} recurring payments.`);
      } catch (err) {
        cds.log(jobName).error('Error processing recurring payments:', err);
      }
    },
    {
      name: jobName,
      timezone: 'Europe/Berlin',
    }
  );
});
