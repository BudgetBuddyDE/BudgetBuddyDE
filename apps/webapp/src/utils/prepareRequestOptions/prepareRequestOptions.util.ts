import {pb} from '@/pocketbase.ts';

export function preparePockebaseRequestOptions(): RequestInit {
  const authStore = pb.authStore;
  return {
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'X-User-Id': authStore.model?.id || '',
      Authorization: `Bearer ${authStore.token}`,
    },
  };
}
