import {type TServiceResponse} from '@budgetbuddyde/types';
import Pocketbase from 'pocketbase';

import {logger} from './logger';

const {POCKETBASE_URL, SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_PASSWORD} = process.env;

if (!POCKETBASE_URL) throw new Error('POCKETBASE_URL is not set');
export const pb = new Pocketbase(POCKETBASE_URL);

pb.authStore.onChange((token, model) => {
  logger.info('Pocketbase auth-store changed! Token {token}', {
    token,
    model,
  });
});

export async function loginWithServiceAccount(): Promise<TServiceResponse<boolean>> {
  try {
    if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PASSWORD) {
      throw new Error('Service account credentials not found!');
    }

    await pb.admins.authWithPassword(SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_PASSWORD);
    console.log(`Authentificated with service-account to ${POCKETBASE_URL}!`);
    return [true, null];
  } catch (error) {
    console.error('Failed to authentificate with service-account', error);
    return [null, error as Error];
  }
}
