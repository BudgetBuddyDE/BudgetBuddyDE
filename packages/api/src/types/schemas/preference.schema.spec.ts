import {describe, expect, it} from 'vite-plus/test';
import {Preference, UpdatePreferencePayload} from './preference.schema';

describe('preference schemas', () => {
  it('accepts region-specific underscore locales', () => {
    expect(UpdatePreferencePayload.safeParse({language: 'en_US'}).success).toBe(true);
    expect(UpdatePreferencePayload.safeParse({language: 'de_DE'}).success).toBe(true);
  });

  it('rejects invalid locale conventions and unknown properties', () => {
    expect(UpdatePreferencePayload.safeParse({language: 'en-US'}).success).toBe(false);
    expect(UpdatePreferencePayload.safeParse({language: 'english_US'}).success).toBe(false);
    expect(UpdatePreferencePayload.safeParse({ownerId: 'someone', onboardingCompleted: true}).success).toBe(false);
  });

  it('requires at least one update and validates timezone and currency', () => {
    expect(UpdatePreferencePayload.safeParse({}).success).toBe(false);
    expect(UpdatePreferencePayload.safeParse({timeZone: 'Not/AZone'}).success).toBe(false);
    expect(UpdatePreferencePayload.safeParse({currency: 'ZZZ'}).success).toBe(false);
    expect(UpdatePreferencePayload.safeParse({timeZone: 'Europe/Berlin', currency: 'EUR'}).success).toBe(true);
  });

  it('validates the preference response shape', () => {
    const date = '2026-01-01T00:00:00.000Z';
    expect(
      Preference.safeParse({
        ownerId: 'user-1',
        onboardingCompleted: true,
        language: 'en_US',
        timeZone: 'Europe/Berlin',
        currency: 'EUR',
        createdAt: date,
        updatedAt: date,
      }).success,
    ).toBe(true);
  });
});
