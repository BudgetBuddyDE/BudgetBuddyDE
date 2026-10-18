import type {TPreference, TUpdatePreferencePayload} from '@budgetbuddyde/api';
import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type PreferencesState = {
  data: TPreference | null;
  ownerId: string | null;
  initialized: boolean;
  status: 'idle' | 'loading' | 'failed';
  isSaving: boolean;
  error: string | null;
  loadRequestId: string | null;
  saveRequestId: string | null;
};

const initialState: PreferencesState = {
  data: null,
  ownerId: null,
  initialized: false,
  status: 'idle',
  isSaving: false,
  error: null,
  loadRequestId: null,
  saveRequestId: null,
};

type Scope = {ownerId: string; requestId: string};
type Seed = {ownerId: string | null; data: TPreference | null; error: string | null};

const preferenceSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    cancelPreferenceRequests: state => {
      state.loadRequestId = null;
      state.saveRequestId = null;
      state.isSaving = false;
      if (state.status === 'loading') state.status = 'idle';
    },
    initializePreferences: (state, {payload}: PayloadAction<Seed>) => {
      const data = payload.data?.ownerId === payload.ownerId ? payload.data : null;
      if (!state.initialized || state.ownerId !== payload.ownerId) {
        return {
          ...initialState,
          initialized: true,
          ownerId: payload.ownerId,
          data,
          error: payload.error,
          status: payload.error ? 'failed' : 'idle',
        };
      }
      // Only strictly newer server data may supersede committed work, never active requests.
      if (
        data &&
        !state.loadRequestId &&
        !state.saveRequestId &&
        (!state.data || Date.parse(data.updatedAt) > Date.parse(state.data.updatedAt))
      ) {
        state.data = data;
        state.error = null;
        state.status = 'idle';
      }
    },
    setPreferencesLoading: (state, {payload}: PayloadAction<Scope>) => {
      if (state.ownerId !== payload.ownerId || state.isSaving) return;
      state.loadRequestId = payload.requestId;
      state.status = 'loading';
      state.error = null;
    },
    finishPreferencesLoading: (
      state,
      {payload}: PayloadAction<Scope & {data: TPreference | null; error: string | null}>,
    ) => {
      if (state.ownerId !== payload.ownerId || state.loadRequestId !== payload.requestId) return;
      state.loadRequestId = null;
      if (payload.data?.ownerId === state.ownerId) {
        state.data = payload.data;
        state.status = 'idle';
        state.error = null;
      } else {
        state.status = 'failed';
        state.error = payload.error ?? 'Unable to load preferences';
      }
    },
    setPreferencesSaving: (state, {payload}: PayloadAction<Scope>) => {
      if (state.ownerId !== payload.ownerId) return;
      state.saveRequestId = payload.requestId;
      state.isSaving = true;
      state.loadRequestId = null;
      state.status = 'idle';
      state.error = null;
    },
    updatePreferences: (state, {payload}: PayloadAction<Scope & {data: TPreference | null; error: string | null}>) => {
      if (state.ownerId !== payload.ownerId || state.saveRequestId !== payload.requestId) return;
      state.saveRequestId = null;
      state.isSaving = false;
      if (payload.data?.ownerId === state.ownerId) {
        state.data = payload.data;
        state.error = null;
      } else {
        state.error = payload.error ?? 'Unable to save preferences';
      }
    },
    resetPreferences: () => ({...initialState, initialized: true}),
  },
});

export const {
  cancelPreferenceRequests,
  initializePreferences,
  setPreferencesLoading,
  finishPreferencesLoading,
  setPreferencesSaving,
  updatePreferences,
  resetPreferences,
} = preferenceSlice.actions;
export type {TUpdatePreferencePayload};
export const preferenceReducer = preferenceSlice.reducer;
