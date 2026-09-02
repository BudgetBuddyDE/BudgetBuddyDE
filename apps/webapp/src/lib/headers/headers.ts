import {headers as NextHeaders} from 'next/headers';
import {logger} from '@/logger';

export async function headers() {
  const nextHeaders = await NextHeaders();
  const HOST_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (!nextHeaders.has('origin') && HOST_DOMAIN) {
    const headers = new Headers(nextHeaders);
    headers.set('origin', `https://${HOST_DOMAIN}`);
    logger.debug('Overriding origin header', {origin: `https://${HOST_DOMAIN}`});
    return headers;
  } else logger.debug('Using original origin header', {origin: nextHeaders.get('origin')});
  return nextHeaders;
}
