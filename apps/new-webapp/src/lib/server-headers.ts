import {headers as nextHeaders} from 'next/headers';

export async function getForwardedHeaders(): Promise<Headers> {
  const incoming = await nextHeaders();
  const forwarded = new Headers(incoming);
  if (!forwarded.has('origin') && process.env.RAILWAY_PUBLIC_DOMAIN) {
    forwarded.set('origin', `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }
  return forwarded;
}
