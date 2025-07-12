import {o} from '@tklein1801/o.js';

export const odata = o(import.meta.env.VITE_BACKEND_HOST, {
  // TODO: Configure the $batch endpoint
  credentials: 'include',
});
