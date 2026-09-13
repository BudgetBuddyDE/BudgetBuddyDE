import {type NextRequest, NextResponse} from 'next/server';
import {getAuth} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getAuth().api.getSession({headers: request.headers});

  return NextResponse.json(session);
}
