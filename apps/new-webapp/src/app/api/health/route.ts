import {NextResponse} from 'next/server';
export function GET() {
  return NextResponse.json({status: 'ok', service: 'new-webapp', timestamp: new Date().toISOString()});
}
