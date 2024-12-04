/**
 * @deprecated
 */
export type TEntityDrawerState<T> = {
  shown: boolean;
  payload: T | null;
};

/**
 * @deprecated
 */
export type TEntityDrawerAction<T> = {type: 'open'; payload?: T | null} | {type: 'toggle'} | {type: 'close'};

/**
 * @deprecated
 */
export function CreateEntityDrawerState<T>(): TEntityDrawerState<T> {
  return {shown: false, payload: null};
}

/**
 * @deprecated
 */
export function useEntityDrawer<T>(
  state: TEntityDrawerState<T>,
  action: TEntityDrawerAction<T>,
): TEntityDrawerState<T> {
  switch (action.type) {
    case 'open':
      return {...state, shown: true, payload: action.payload || null};

    case 'toggle':
      return {...state, shown: !state.shown};

    case 'close':
      return {...state, shown: false};

    default:
      throw new Error('Trying to execute unknown action');
  }
}
