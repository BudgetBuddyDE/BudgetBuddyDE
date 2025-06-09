import { z } from "zod";

const ZDate = z.date().or(z.string().transform((str) => new Date(str)));

export const ZUserSchema = z.object({
  id: z.string(),
  email: z.string().transform((val) => val.toLowerCase()),
  emailVerified: z.boolean().default(false),
  name: z.string(),
  image: z.string().nullish(),
  createdAt: ZDate,
  updatedAt: ZDate,
});
export type TUser = z.infer<typeof ZUserSchema>;

export const ZSessionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  expiresAt: ZDate,
  createdAt: ZDate,
  updatedAt: ZDate,
  token: z.string(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
});
export type TSession = z.infer<typeof ZSessionSchema>;

export const ZGetSessionResponse = z.object({
  user: ZUserSchema,
  session: ZSessionSchema,
});
export type TGetSessionResponse = z.infer<typeof ZGetSessionResponse>;
