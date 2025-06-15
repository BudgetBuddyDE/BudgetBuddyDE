import {ZDate} from '@budgetbuddyde/types';
import {z} from 'zod';

export const ZExternalAuthProvider = z.enum(['google', 'github']);
export type TExternalAuthProvider = z.infer<typeof ZExternalAuthProvider>;

export const ZUser = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.string(),
  banned: z.boolean(),
  banReason: z.string(),
  banExpires: z.date().nullable(),
});
export type TUser = z.infer<typeof ZUser>;

export const ZAccount = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  idToken: z.string(),
  accessTokenExpiresAt: z.date(),
  refreshTokenExpiresAt: z.date(),
  scope: z.string(),
  password: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TAccount = z.infer<typeof ZAccount>;

export const ZVerification = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TVerification = z.infer<typeof ZVerification>;

export const ZSignUpMethod = z.enum(['email', 'social']);
export type TSignUpMethod = z.infer<typeof ZSignUpMethod>;

export const ZSignUpWithEmailPayload = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  callbackURL: z.string().optional(),
});
export type TSignUpWithEmailPayload = z.infer<typeof ZSignUpWithEmailPayload>;

export const ZSignUpWithEmailResponse = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    image: z.string().nullable(),
    emailVerified: z.boolean(),
    createdAt: ZDate,
    updatedAt: ZDate,
  }),
});
export type TSignUpWithEmailResponse = z.infer<typeof ZSignUpWithEmailResponse>;

export const ZSignUpWithSocialPayload = z.object({
  callbackURL: z.string().url().optional(),
  newUserCallbackURL: z.string().url().optional(),
  errorCallbackURL: z.string().url().optional(),
  provider: ZExternalAuthProvider,
  disableRedirect: z.boolean().optional(),
  idToken: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  requestSignUp: z.boolean().optional(),
  loginHint: z.string().optional(),
});
export type TSignUpWithSocialPayload = z.infer<typeof ZSignUpWithSocialPayload>;

export const ZSignUpWithSocialResponse = z.object({});
export type TSignUpWithSocialResponse = z.infer<typeof ZSignUpWithSocialResponse>;

export type EMail = string & {__brand: 'Email'};

export const ZSignInMethod = ZSignUpMethod;
export type TSignInMethod = z.infer<typeof ZSignInMethod>;

export const ZSignInWithEmailPayload = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  callbackURL: z.string().optional(),
  rememberMe: z.boolean().optional(),
});
export type TSignInWithEmailPayload = z.infer<typeof ZSignInWithEmailPayload>;

export const ZSignInWithSocialPayload = z.object({
  callbackURL: z.string().optional(),
  newUserCallbackURL: z.string().optional(),
  errorCallbackURL: z.string().optional(),
  provider: ZExternalAuthProvider,
  disableRedirect: z.boolean().optional(),
  idToken: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  requestSignUp: z.boolean().optional(),
  loginHint: z.string().optional(),
});
export type TSignInWithSocialPayload = z.infer<typeof ZSignInWithSocialPayload>;
