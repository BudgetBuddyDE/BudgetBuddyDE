'use client';

import type {TPreference, TUpdatePreferencePayload} from '@budgetbuddyde/api';
import {nanoid} from '@reduxjs/toolkit';
import {useRouter} from 'next/navigation';
import React from 'react';
import {useStore} from 'react-redux';
import {apiClient} from '@/apiClient';
import {authClient} from '@/authClient';
import {
  cancelPreferenceRequests,
  initializePreferences,
  finishPreferencesLoading,
  resetPreferences,
  setPreferencesLoading,
  setPreferencesSaving,
  updatePreferences as updatePreferencesAction,
} from '@/lib/features/preferences/preferenceSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';
import {
  getPreferenceLocale,
  normalizePreferences,
  type EffectivePreferences,
} from '@/lib/preferences/normalizePreferences';
import type {AppStore} from '@/lib/store';

export type PreferencesContextValue = {
  preferences: TPreference | null;
  effectivePreferences: EffectivePreferences;
  locale: 'en-US';
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  reloadPreferences: () => Promise<void>;
  updatePreferences: (payload: TUpdatePreferencePayload) => Promise<void>;
};

const PreferencesContext = React.createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  children,
  initialPreferences,
  initialError,
}: React.PropsWithChildren<{initialPreferences: TPreference | null; initialError: string | null}>) {
  const dispatch = useAppDispatch();
  const store = useStore.withTypes<AppStore>()();
  const router = useRouter();
  const state = useAppSelector(rootState => rootState.preferences);
  const {data: session, isPending: isSessionPending} = authClient.useSession();
  const userId = session?.user.id;
  const auth = React.useRef({userId, isSessionPending, generation: 0});
  if (auth.current.userId !== userId || auth.current.isSessionPending !== isSessionPending) {
    auth.current = {userId, isSessionPending, generation: auth.current.generation + 1};
  }
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      dispatch(cancelPreferenceRequests());
    };
  }, [dispatch]);

  const reloadPreferences = React.useCallback(async () => {
    const {userId: ownerId, isSessionPending: pending, generation} = auth.current;
    if (!ownerId || pending || store.getState().preferences.isSaving) return;
    const scope = {ownerId, requestId: nanoid()};
    dispatch(setPreferencesLoading(scope));
    try {
      const [result, error] = await apiClient.backend.preference.get({cache: 'no-store'});
      if (!mounted.current || auth.current.generation !== generation) return;
      dispatch(finishPreferencesLoading({...scope, data: result?.data ?? null, error: error?.message ?? null}));
    } catch (error) {
      if (!mounted.current || auth.current.generation !== generation) return;
      dispatch(
        finishPreferencesLoading({
          ...scope,
          data: null,
          error: error instanceof Error ? error.message : 'Unable to load preferences',
        }),
      );
    }
  }, [dispatch, store]);

  React.useEffect(() => {
    if (isSessionPending) {
      dispatch(cancelPreferenceRequests());
      return;
    }
    if (!userId) {
      dispatch(resetPreferences());
      return;
    }
    const previous = store.getState().preferences;
    const canSeed = !previous.initialized || previous.ownerId === userId;
    const seed = canSeed && initialPreferences?.ownerId === userId ? initialPreferences : null;
    dispatch(
      initializePreferences({
        ownerId: userId,
        data: seed,
        error: canSeed && !initialPreferences ? initialError : null,
      }),
    );
    if (
      (!previous.initialized ||
        previous.ownerId !== userId ||
        (!previous.data && !previous.error && !previous.loadRequestId)) &&
      !seed &&
      !(canSeed && initialError && !initialPreferences)
    ) {
      void reloadPreferences();
    }
  }, [dispatch, initialError, initialPreferences, isSessionPending, reloadPreferences, store, userId]);

  const updatePreferences = React.useCallback(
    async (payload: TUpdatePreferencePayload) => {
      const {userId: ownerId, isSessionPending: pending, generation} = auth.current;
      if (!ownerId || pending || store.getState().preferences.ownerId !== ownerId) {
        throw new Error('Sign in before saving preferences');
      }
      if (store.getState().preferences.isSaving) throw new Error('Preferences are already being saved');
      const scope = {ownerId, requestId: nanoid()};
      dispatch(setPreferencesSaving(scope));
      try {
        const [result, error] = await apiClient.backend.preference.update(payload);
        if (!mounted.current || auth.current.generation !== generation) {
          throw new Error('The session changed while saving preferences');
        }
        if (error || !result || result.data.ownerId !== ownerId) {
          throw error ?? new Error('Unable to save preferences');
        }
        dispatch(updatePreferencesAction({...scope, data: result.data, error: null}));
        router.refresh();
      } catch (error) {
        if (mounted.current && auth.current.generation === generation) {
          dispatch(
            updatePreferencesAction({
              ...scope,
              data: null,
              error: error instanceof Error ? error.message : 'Unable to save preferences',
            }),
          );
        }
        throw error;
      }
    },
    [dispatch, router, store],
  );

  // Seed the very first SSR/hydration render without writing to Redux during render.
  // Once initialized, never resurrect server props after logout or an account switch.
  const visibleState = state.initialized && (state.ownerId === (userId ?? null) || (isSessionPending && !userId));
  const preferences = visibleState
    ? state.data
    : !state.initialized && ((isSessionPending && !userId) || initialPreferences?.ownerId === userId)
      ? initialPreferences
      : null;
  const effectivePreferences = React.useMemo(() => normalizePreferences(preferences), [preferences]);
  const error = visibleState ? state.error : !state.initialized ? initialError : null;
  const value = React.useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      effectivePreferences,
      locale: getPreferenceLocale(effectivePreferences),
      isLoading: visibleState
        ? state.status === 'loading'
        : !preferences && !error && Boolean(userId || isSessionPending),
      isSaving: visibleState && state.isSaving,
      error,
      reloadPreferences,
      updatePreferences,
    }),
    [
      preferences,
      effectivePreferences,
      visibleState,
      state.status,
      state.isSaving,
      error,
      userId,
      isSessionPending,
      reloadPreferences,
      updatePreferences,
    ],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferencesContext() {
  const value = useOptionalPreferencesContext();
  if (!value) throw new Error('usePreferences must be used within PreferencesProvider');
  return value;
}

export function useOptionalPreferencesContext() {
  return React.useContext(PreferencesContext);
}
