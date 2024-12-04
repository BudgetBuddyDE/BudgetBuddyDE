/**
 * Represents the state of the entity drawer.
 */
export type TEntityDrawerState = {
  loading: boolean;
  success: boolean;
  error: Error | null;
};

/**
 * Represents the possible actions that can be dispatched to the entity drawer reducer.
 */
export type TEntityDrawerAction =
  | {type: 'RESET'}
  | {type: 'SUBMIT'}
  | {type: 'SUCCESS'; error?: TEntityDrawerState['error']}
  | {type: 'ERROR'; error: TEntityDrawerState['error']};

/**
 * Default state for the EntityDrawer reducer.
 */
export const DefaultEntityDrawerState: TEntityDrawerState = {
  loading: false,
  success: false,
  error: null,
};

/**
 * Reducer function for the EntityDrawer component.
 *
 * @param state - The current state of the EntityDrawer.
 * @param action - The action object that describes the state change.
 * @returns The new state of the EntityDrawer after applying the action.
 * @throws Error if an unknown action type is provided.
 */
export function EntityDrawerReducer(state: TEntityDrawerState, action: TEntityDrawerAction): TEntityDrawerState {
  switch (action.type) {
    case 'RESET':
      return DefaultEntityDrawerState;

    case 'SUBMIT':
      return {...state, loading: true};

    case 'SUCCESS':
      return {...state, loading: false, success: true, error: action.error ?? null};

    case 'ERROR':
      return {...state, loading: false, success: false, error: action.error};

    default:
      throw new Error('Trying to execute unknown action');
  }
}
