import 'dotenv/config';
import { config } from './config';
import { ELogCategory, log, logMiddleware } from './middleware';

/**
 * Check if all required environment-variables are set
 */
const MISSING_ENVIRONMENT_VARIABLES = config.environmentVariables.filter((variable) => {
  if (!process.env[variable]) {
    return variable;
  }
});
if (MISSING_ENVIRONMENT_VARIABLES.length >= 1) {
  log(
    'ERROR',
    ELogCategory.SETUP,
    JSON.stringify({
      missing: MISSING_ENVIRONMENT_VARIABLES,
      error: 'server/missing-environment-variables',
    })
  );
  process.exit(1);
}

import { name, version } from '../package.json';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import DefaultRoute from './router/Default.router';

export const app = express();

app.use(cors(config.cors));
app.use(logMiddleware);
app.use(bodyParser.json());

app.use('/default', DefaultRoute);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/status', (req, res) => {
  res.json({ status: 'OK' });
});

export const listen = app.listen(config.port, process.env.HOSTNAME || 'localhost', () => {
  console.table({
    'Application Name': name,
    'Application Version': version,
    'Runtime Environment': config.environment,
    'Node Version': process.version,
    'Server Port': config.port,
  });
  log('LOG', ELogCategory.SETUP, `Server is listening on port ${config.port}`);
});
