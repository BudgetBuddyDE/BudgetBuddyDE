import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {authClient} from './authClient';

export async function requireSession() {
  const result = await authClient.getSession({fetchOptions: {headers: await headers()}});
  if (result.error || !result.data) redirect('/sign-in');
  return result.data;
}
