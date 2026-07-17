import {describe, expect, it} from 'vitest';
import {recurringStatus} from './recurring-status';

const now = new Date('2026-07-16T12:00:00Z');

describe('recurringStatus', () => {
  it('distinguishes active, manually inactive, and expired payments', () => {
    expect(recurringStatus({paused: false, expiresAt: null}, now)).toBe('active');
    expect(recurringStatus({paused: true, expiresAt: null}, now)).toBe('inactive');
    expect(recurringStatus({paused: false, expiresAt: new Date('2026-07-15')}, now)).toBe('expired');
    expect(recurringStatus({paused: true, expiresAt: new Date('2026-07-15')}, now)).toBe('expired');
  });
});
