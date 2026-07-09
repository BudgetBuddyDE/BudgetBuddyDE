import {EnvironmentVariableNotSetError} from './errors';
import type {ExampleConfig} from './types';

const DEFAULT_RESULT_LIMIT = 100;

function getRequiredEnv(env: NodeJS.ProcessEnv, variableName: string) {
  const value = env[variableName]?.trim();

  if (!value) {
    throw new EnvironmentVariableNotSetError(variableName);
  }

  return value;
}

export function readConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ExampleConfig {
  const limit = Number(env.BUDGETBUDDY_RESULT_LIMIT ?? DEFAULT_RESULT_LIMIT);

  return {
    apiKey: getRequiredEnv(env, 'BUDGETBUDDY_API_KEY'),
    backendUrl: getRequiredEnv(env, 'BUDGETBUDDY_BACKEND_URL'),
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_RESULT_LIMIT,
  };
}
