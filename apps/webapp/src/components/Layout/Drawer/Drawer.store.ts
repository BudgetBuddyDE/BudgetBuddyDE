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
  if (typeof window !== 'undefined') {
    const state = localStorage.getItem('bb.sidebar.show');
    return state == null ? true : state == 'true';
  }
  // Default-Wert für SSR
  return true;
}

function saveState(state: boolean) {
  if (typeof window !== 'undefined') {
    return localStorage.setItem('bb.sidebar.show', state.toString());
  }
}
