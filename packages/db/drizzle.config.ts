import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import 'dotenv/config';
import {defineConfig} from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new EnvironmentNotSetError('DATABASE_URL');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
