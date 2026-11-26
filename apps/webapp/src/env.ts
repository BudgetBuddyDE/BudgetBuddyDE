import {z} from 'zod';

export const publicEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_BACKEND_SERVICE_HOST: z
    .string()
    .trim()
    .refine(value => value === '' || URL.canParse(value), 'must be a valid URL')
    .optional(),
  NEXT_PUBLIC_LOG_LEVEL: z.string().optional(),
  NEXT_PUBLIC_OTEL_ENDPOINT: z
    .string()
    .trim()
    .refine(value => value === '' || URL.canParse(value), 'must be a valid URL')
    .optional(),
});

export type PublicEnvironment = z.infer<typeof publicEnvSchema>;

export function parsePublicEnvironment(environment: Partial<PublicEnvironment>): PublicEnvironment {
  const result = publicEnvSchema.safeParse(environment);
  if (!result.success) {
    const variables = Array.from(new Set(result.error.issues.map(issue => String(issue.path[0]))));
    throw new Error(`Invalid public environment variables: ${variables.join(', ')}.`);
  }
  return result.data;
}

export const publicEnv = parsePublicEnvironment({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_BACKEND_SERVICE_HOST: process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST,
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
  NEXT_PUBLIC_OTEL_ENDPOINT: process.env.NEXT_PUBLIC_OTEL_ENDPOINT,
});
