import type {TPreference} from '@budgetbuddyde/api';
import {describe, expect, it} from 'vitest';
import {
  finishPreferencesLoading,
  initializePreferences,
  preferenceReducer,
  resetPreferences,
  setPreferencesLoading,
  setPreferencesSaving,
  updatePreferences,
} from './preferenceSlice';

const data: TPreference = {
  ownerId: 'alice' as TPreference['ownerId'],
  language: 'en_US',
  currency: 'EUR',
  timeZone: 'Europe/Berlin',
  onboardingCompleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const seed = () => preferenceReducer(undefined, initializePreferences({ownerId: 'alice', data, error: null}));
const load = {ownerId: 'alice', requestId: 'load'};
const save = {ownerId: 'alice', requestId: 'save'};

describe('preferences reducer', () => {
  it('accepts strictly newer server seeds after a save but rejects older and equal versions', () => {
    const saved = {...data, currency: 'USD', updatedAt: '2026-01-02T00:00:00.000Z'};
    const fresh = {...data, updatedAt: '2026-01-03T00:00:00.000Z'};
    let state = preferenceReducer(seed(), setPreferencesSaving(save));
    state = preferenceReducer(state, updatePreferences({...save, data: saved, error: null}));
    state = preferenceReducer(state, initializePreferences({ownerId: 'alice', data, error: null}));
    expect(state.data).toEqual(saved);
    state = preferenceReducer(
      state,
      initializePreferences({ownerId: 'alice', data: {...saved, currency: 'EUR'}, error: null}),
    );
    expect(state.data).toEqual(saved);
    state = preferenceReducer(state, initializePreferences({ownerId: 'alice', data: fresh, error: null}));
    expect(state.data).toEqual(fresh);
    state = preferenceReducer(state, initializePreferences({ownerId: 'alice', data: saved, error: null}));
    expect(state.data).toEqual(fresh);
  });

  it('defers newer server seeds during active loads and saves, then accepts them after loading', () => {
    const fresh = {...data, currency: 'USD', updatedAt: '2026-01-03T00:00:00.000Z'};
    const refreshed = initializePreferences({ownerId: 'alice', data: fresh, error: null});
    let state = preferenceReducer(seed(), setPreferencesSaving(save));
    state = preferenceReducer(state, refreshed);
    expect(state.data).toEqual(data);
    state = preferenceReducer(state, updatePreferences({...save, data, error: null}));
    state = preferenceReducer(state, setPreferencesLoading(load));
    state = preferenceReducer(state, refreshed);
    expect(state.data).toEqual(data);
    state = preferenceReducer(state, finishPreferencesLoading({...load, data, error: null}));
    state = preferenceReducer(state, refreshed);
    expect(state.data).toEqual(fresh);
  });

  it('rejects a reload started before a save and stale server refreshes', () => {
    let state = preferenceReducer(seed(), setPreferencesLoading(load));
    state = preferenceReducer(state, setPreferencesSaving(save));
    state = preferenceReducer(state, updatePreferences({...save, data: {...data, currency: 'USD'}, error: null}));
    state = preferenceReducer(state, finishPreferencesLoading({...load, data, error: null}));
    state = preferenceReducer(state, initializePreferences({ownerId: 'alice', data, error: null}));
    expect(state.data?.currency).toBe('USD');
    expect(state.isSaving).toBe(false);
  });

  it('rejects responses after logout and account switches', () => {
    let state = preferenceReducer(seed(), setPreferencesSaving(save));
    state = preferenceReducer(state, resetPreferences());
    state = preferenceReducer(state, updatePreferences({...save, data, error: null}));
    expect(state.data).toBeNull();
    state = preferenceReducer(state, initializePreferences({ownerId: 'bob', data, error: null}));
    state = preferenceReducer(state, finishPreferencesLoading({...load, data, error: null}));
    expect(state.ownerId).toBe('bob');
    expect(state.data).toBeNull();
  });

  it('keeps data on failures and accepts only the latest reload', () => {
    let state = preferenceReducer(seed(), setPreferencesLoading(load));
    state = preferenceReducer(state, setPreferencesLoading({...load, requestId: 'new'}));
    state = preferenceReducer(
      state,
      finishPreferencesLoading({...load, data: {...data, currency: 'USD'}, error: null}),
    );
    expect(state.data?.currency).toBe('EUR');
    state = preferenceReducer(
      state,
      finishPreferencesLoading({...load, requestId: 'new', data: null, error: 'offline'}),
    );
    expect(state.data).toEqual(data);
    expect(state.error).toBe('offline');
    expect(state.status).toBe('failed');
  });
});
