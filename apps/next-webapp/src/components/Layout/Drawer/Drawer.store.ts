"use client";

import {create} from 'zustand';

export interface IDrawerStore {
  open: boolean;
  set: (state: boolean) => void;
  toggle: () => void;
}

export const useDrawerStore = create<IDrawerStore>(set => ({
  open: getSavedState(),
  set: state => {
    set({open: state});
    saveState(state);
  },
  toggle: () =>
    set(state => {
      const newState = !state.open;
      saveState(newState);
      return {open: newState};
    }),
}));

function getSavedState() {
  const state = localStorage.getItem('bb.sidebar.show');
  return state == null ? true : state == 'true';
}

function saveState(state: boolean) {
  localStorage.setItem('bb.sidebar.show', state.toString());
}
