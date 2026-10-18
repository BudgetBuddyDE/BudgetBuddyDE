import 'server-only';
import {cache} from 'react';
import {apiClient} from '@/apiClient';
import {headers} from '@/lib/headers';

export const getPreferences = cache(async () =>
  apiClient.backend.preference.get({headers: await headers(), cache: 'no-store'}),
);
