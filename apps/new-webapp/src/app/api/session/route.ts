import {headers} from 'next/headers';
import {NextResponse} from 'next/server';
import {authClient} from '@/authClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  const {data, error} = await authClient.getSession({fetchOptions: {headers: await headers()}});
  if (error || !data) return NextResponse.json({authenticated: false}, {status: 401});
  return NextResponse.json({
    authenticated: true,
    user: {id: data.user.id, name: data.user.name, email: data.user.email},
  });
}
