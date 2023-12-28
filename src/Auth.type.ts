import {z} from 'zod';
import {ZUser, type TUser} from './User.type';
import {ZCreatedAt, ZEmail} from './Base.type';

export type TSession = TUser;

export const ZSignUpPayload = z.object({
  email: ZEmail,
  password: z.string(),
  name: z.string(),
  surname: z.string(),
});
export type TSignUpPayload = z.infer<typeof ZSignUpPayload>;

export const ZSignInPayload = z.object({
  email: ZEmail,
  password: z.string(),
});
export type TSignInPayload = z.infer<typeof ZSignInPayload>;

export enum EVerifyMailReturnCode {
  SUCCESS = 'SUCCESS',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  INVALID_EMAIL = 'INVALID_EMAIL',
  NOT_FOUND = 'NOT_FOUND',
}
export const ZVerifyMailReturnCode = z.nativeEnum(EVerifyMailReturnCode);

export const VerifyMailReturnCodeToMessage: Record<EVerifyMailReturnCode, string> = {
  [EVerifyMailReturnCode.SUCCESS]: "You're successfully verified your email!",
  [EVerifyMailReturnCode.ALREADY_VERIFIED]: 'Your email is already verified!',
  [EVerifyMailReturnCode.INVALID_EMAIL]: "This email isn't bound to your user account!",
  [EVerifyMailReturnCode.NOT_FOUND]: 'User not found!',
};

export const ZPasswordReset = z.object({
  id: z.number(),
  owner: ZUser,
  otp: z.string().uuid(),
  used: z.boolean(),
  createdAt: ZCreatedAt,
});
export type TPasswordReset = z.infer<typeof ZPasswordReset>;
