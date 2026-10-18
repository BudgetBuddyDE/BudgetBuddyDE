'use client';

import type {TPreference, TUpdatePreferencePayload} from '@budgetbuddyde/api';
import React from 'react';
import {apiClient} from '@/apiClient';
import {authClient} from '@/authClient';
import {
  initializePreferences,
  resetPreferences,
  setPreferencesError,
  setPreferencesLoading,
  setPreferencesSaving,
  updatePreferences as updatePreferencesAction,
} from '@/lib/features/preferences/preferenceSlice';
import {useAppDispatch, useAppSelector} from '@/lib/hooks';

type PreferencesContextValue = {
  preferences: TPreference | null;
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
  const state = useAppSelector(rootState => rootState.preferences);
  const {data: session, isPending: isSessionPending} = authClient.useSession();
  const userId = session?.user.id;

  const reloadPreferences = React.useCallback(async () => {
    dispatch(setPreferencesLoading());
    const [result, error] = await apiClient.backend.preference.get({cache: 'no-store'});
    if (error || !result) {
      dispatch(setPreferencesError(error?.message ?? 'Unable to load preferences'));
      return;
    }
    dispatch(initializePreferences(result.data));
  }, [dispatch]);

  React.useEffect(() => {
    dispatch(initializePreferences(initialPreferences));
    if (!initialPreferences && initialError) dispatch(setPreferencesError(initialError));
  }, [dispatch, initialError, initialPreferences]);

  React.useEffect(() => {
    if (isSessionPending) return;
    if (!userId) {
      dispatch(resetPreferences());
      return;
    }
    if (state.data && state.data.ownerId !== userId) {
      dispatch(resetPreferences());
      void reloadPreferences();
    }
  }, [dispatch, isSessionPending, reloadPreferences, state.data?.ownerId, userId]);

  const updatePreferences = React.useCallback(
    async (payload: TUpdatePreferencePayload) => {
      dispatch(setPreferencesSaving(true));
      const [result, error] = await apiClient.backend.preference.update(payload);
      if (error || !result) {
        dispatch(setPreferencesSaving(false));
        throw error ?? new Error('Unable to save preferences');
      }
      dispatch(updatePreferencesAction(result.data));
    },
    [dispatch],
  );

  const value = React.useMemo<PreferencesContextValue>(
    () => ({
      preferences: state.data,
      isLoading: state.status === 'loading',
      isSaving: state.isSaving,
      error: state.error,
      reloadPreferences,
      updatePreferences,
    }),
    [state.data, state.error, state.isSaving, state.status, reloadPreferences, updatePreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferencesContext() {
  const value = React.useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used within PreferencesProvider');
  return value;
}
