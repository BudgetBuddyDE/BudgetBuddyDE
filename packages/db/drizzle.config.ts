import {EnvironmentVariable} from '@budgetbuddyde/core/environment/EnvironmentVariable';
import 'dotenv/config';
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: new EnvironmentVariable('DATABASE_URL').get(),
  },
});
