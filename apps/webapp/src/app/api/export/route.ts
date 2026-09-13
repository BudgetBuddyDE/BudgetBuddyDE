import {getAuth} from '@/lib/auth';
import {getAuthExportData} from '@/lib/auth/authExport';
import {createAuthExportHandler} from '@/lib/auth/dataExport';

export const dynamic = 'force-dynamic';

const EXPORT_RATE_LIMIT = {limit: 2, windowMs: 15 * 60 * 1000};

// ponytail: per-instance limiter; move to Redis if the webapp ever runs multiple replicas.
const exportAttempts = new Map<string, {count: number; resetAt: number}>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempt = exportAttempts.get(ip);
  if (!attempt || attempt.resetAt <= now) {
    exportAttempts.set(ip, {count: 1, resetAt: now + EXPORT_RATE_LIMIT.windowMs});
    return false;
  }
  attempt.count += 1;
  return attempt.count > EXPORT_RATE_LIMIT.limit;
}

const handler = createAuthExportHandler({
  getSession: headers => getAuth().api.getSession({headers}),
  getData: getAuthExportData,
});

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return Response.json(
        {error: 'Too many export requests. Please try again later.'},
        {status: 429, headers: {'Cache-Control': 'no-store'}},
      );
    }
  }

  return handler(request);
}
