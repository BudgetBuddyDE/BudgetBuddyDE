import {preferences} from '@budgetbuddyde/db/backend';
import {db} from '../db';

/** Preserve existing settings when initialization is retried or races with another request. */
export async function initializePreferences(userId: string, onboardingCompleted = false): Promise<void> {
  await db
    .insert(preferences)
    .values({ownerId: userId, onboardingCompleted})
    .onConflictDoNothing({target: preferences.ownerId});
}
