import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import {authClient} from '@/authClient';

export async function GET() {
  const result = await authClient.getSession({fetchOptions: {headers: await headers()}});
  return NextResponse.json(result.data, {status: result.error ? 401 : 200});
}
