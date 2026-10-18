import {UpdatePreferencePayload} from '@budgetbuddyde/api/preference';
import {preferences} from '@budgetbuddyde/db/backend';
import {eq} from 'drizzle-orm';
import {db} from '../db';
import {invalidateDomainMutation} from './cache';
import {normalizeResponse} from './response';
import {logger} from '../lib/logger';
import {initializePreferences} from '../lib/preferences';
import {ApiResponse, HTTPStatusCode} from '../models';

const updateSchema = UpdatePreferencePayload;

async function getOrCreate(userId: string) {
  const [current] = await db.select().from(preferences).where(eq(preferences.ownerId, userId)).limit(1);
  if (current) return current;

  // Missing records are treated as legacy accounts, never as first-run users.
  logger.warn('User preferences missing; initializing legacy defaults', {
    userId,
    event: 'preferences.missing',
  });
  await initializePreferences(userId, true);
  const [created] = await db.select().from(preferences).where(eq(preferences.ownerId, userId)).limit(1);
  if (!created) throw new Error('Unable to initialize user preferences');
  return created;
}

export async function get(userId: string) {
  const preference = await getOrCreate(userId);
  return normalizeResponse(
    ApiResponse.builder().withStatus(HTTPStatusCode.OK).withData(preference).withFrom('db').build(),
  );
}

export async function update(userId: string, input: unknown) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return normalizeResponse(
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('Invalid preference payload')
        .withData(parsed.error.issues)
        .build(),
    );
  }

  await getOrCreate(userId);
  const [updated] = await db
    .update(preferences)
    .set({...parsed.data, updatedAt: new Date()})
    .where(eq(preferences.ownerId, userId))
    .returning();

  if (!updated) throw new Error('Unable to update user preferences');

  await invalidateDomainMutation(userId, '/api/preference');
  return normalizeResponse(
    ApiResponse.builder().withStatus(HTTPStatusCode.OK).withData(updated).withFrom('db').build(),
  );
}
