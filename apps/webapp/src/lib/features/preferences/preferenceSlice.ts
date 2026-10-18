import type {TPreference, TUpdatePreferencePayload} from '@budgetbuddyde/api';
import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

export type PreferencesState = {
  data: TPreference | null;
  status: 'idle' | 'loading' | 'failed';
  isSaving: boolean;
  error: string | null;
};

const initialState: PreferencesState = {data: null, status: 'idle', isSaving: false, error: null};

const preferenceSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    initializePreferences: (state, action: PayloadAction<TPreference | null>) => {
      state.data = action.payload;
      state.status = action.payload ? 'idle' : 'failed';
      state.error = action.payload ? null : state.error;
    },
    setPreferencesLoading: state => {
      state.status = 'loading';
      state.error = null;
    },
    setPreferencesError: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    setPreferencesSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<TPreference>) => {
      state.data = action.payload;
      state.status = 'idle';
      state.isSaving = false;
      state.error = null;
    },
    resetPreferences: () => initialState,
  },
});

export const {
  initializePreferences,
  setPreferencesLoading,
  setPreferencesError,
  setPreferencesSaving,
  updatePreferences,
  resetPreferences,
} = preferenceSlice.actions;
export type {TUpdatePreferencePayload};
export const preferenceReducer = preferenceSlice.reducer;
