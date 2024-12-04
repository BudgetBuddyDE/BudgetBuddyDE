import {io} from 'socket.io-client';

import {pb} from '@/pocketbase.ts';

export function getSocketIOClient() {
  const authStore = pb.authStore;
  const {NODE_ENV, STOCK_SERVICE_HOST} = process.env;
  return io(`${NODE_ENV === 'production' ? 'wss' : 'ws'}://${STOCK_SERVICE_HOST!.split('//')[1]}`, {
    autoConnect: false,
    auth: {
      userId: authStore.model?.id || '',
      token: `Bearer ${authStore.token}`,
    },
  });
}
