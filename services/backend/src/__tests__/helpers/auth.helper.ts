import type {NextFunction, Request, Response} from 'express';
import type {RequestContext} from '../../types';

/**
 * Creates a mock request context for testing
 * Note: This always returns non-null user and session for testing authenticated scenarios.
 * For testing unauthenticated scenarios, tests should bypass the middleware entirely.
 */
export function createMockContext(userId: string, sessionId?: string): RequestContext {
  return {
    user: {
      id: userId,
      email: `test-${userId}@example.com`,
      name: `Test User ${userId}`,
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: sessionId || `session-${userId}`,
      userId: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      token: `token-${userId}`,
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

/**
 * Mock middleware that sets request context without calling auth service
 */
export function mockAuthMiddleware(userId: string) {
  return (req: Request & {context?: RequestContext}, _res: Response, next: NextFunction) => {
    req.context = createMockContext(userId);
    next();
  };
}

/**
 * Generate test user IDs
 */
export function generateTestUserId(suffix = ''): string {
  return `test-user-${suffix || Date.now()}`;
}
