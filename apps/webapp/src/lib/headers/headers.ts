import type {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import {headers as NextHeaders} from 'next/headers';
import {logger} from '@/logger';

export async function headers(): Promise<ReadonlyHeaders | Headers> {
  const nextHeaders = await NextHeaders();
  const HOST_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (!nextHeaders.has('origin') && HOST_DOMAIN) {
    const headers = new Headers(nextHeaders);
    headers.set('origin', `https://${HOST_DOMAIN}`);
    logger.debug(`Overriding origin header to https://%s`, HOST_DOMAIN);
    return headers;
  } else logger.debug(`Using original origin header value: %s`, nextHeaders.get('origin'));
  return nextHeaders;
}
