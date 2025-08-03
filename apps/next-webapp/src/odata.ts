import { o } from '@tklein1801/o.js';
// import { headers } from 'next/headers';

export function initOdataClient(rootUrl: string = 'https://localhost:4004') {
  // const reqHeaders = await headers();
  return o(rootUrl, {
    credentials: 'include',
    // headers: reqHeaders,
  });
}
