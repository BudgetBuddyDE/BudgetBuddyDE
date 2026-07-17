import {NextResponse} from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'new-webapp',
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'development',
  });
}
