import {account, apikey, session, user} from '@budgetbuddyde/db/auth';
import {eq} from 'drizzle-orm';
import {auth} from './auth';
import {createAuthExportHandler, type TAuthExportData} from './dataExport';
import {db} from './db';

async function getAuthExportData(userId: string): Promise<TAuthExportData> {
  const [[exportedUser], sessions, accounts, apiKeys] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId)),
    db
      .select({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, userId)),
    db
      .select({
        id: account.id,
        accountId: account.accountId,
        providerId: account.providerId,
        userId: account.userId,
        accessTokenExpiresAt: account.accessTokenExpiresAt,
        refreshTokenExpiresAt: account.refreshTokenExpiresAt,
        scope: account.scope,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      })
      .from(account)
      .where(eq(account.userId, userId)),
    db
      .select({
        id: apikey.id,
        name: apikey.name,
        referenceId: apikey.referenceId,
        enabled: apikey.enabled,
        createdAt: apikey.createdAt,
        updatedAt: apikey.updatedAt,
        expiresAt: apikey.expiresAt,
        rateLimitEnabled: apikey.rateLimitEnabled,
        rateLimitTimeWindow: apikey.rateLimitTimeWindow,
        rateLimitMax: apikey.rateLimitMax,
        requestCount: apikey.requestCount,
        remaining: apikey.remaining,
        lastRequest: apikey.lastRequest,
      })
      .from(apikey)
      .where(eq(apikey.referenceId, userId)),
  ]);

  if (!exportedUser) throw new Error('Authenticated user no longer exists.');
  return {user: exportedUser, sessions, accounts, apiKeys};
}

export const authExportHandler = createAuthExportHandler({
  getSession: headers => auth.api.getSession({headers}),
  getData: getAuthExportData,
});
