import {getTrustedOrigins} from '@budgetbuddyde/utils';
import {type BetterAuthOptions, betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';

import {config} from './config';
import {db} from './db';
import * as authSchema from './db/schema/auth.schema';
import {isCSRFCheckDisabled} from './utils';

const options: BetterAuthOptions = {
  appName: config.service,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  logger: {
    disabled: false,
    level: config.log.level,
    log: config.log.log,
  },
  trustedOrigins: getTrustedOrigins(),
  advanced: {
    disableCSRFCheck: isCSRFCheckDisabled(),
    useSecureCookies: config.runtime == 'production',
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
};

export const auth = betterAuth(options);
