import {z} from 'better-auth/*';
import {createSelectSchema} from 'drizzle-zod';

import {account, user, verification} from './auth-schema';

export * from './auth-schema';

export const ZUser = createSelectSchema(user);
export type TUser = z.infer<typeof ZUser>;

export const ZAccount = createSelectSchema(account);
export type TAccount = z.infer<typeof ZAccount>;

export const ZVerification = createSelectSchema(verification);
export type TVerification = z.infer<typeof ZVerification>;
